import { NextResponse } from 'next/server';
import { createApiAuthHandler } from '@/lib/authMiddleware';
import { ValidationError, DatabaseError } from '@/lib/errorHandler';
import { logError } from '@/lib/errorHandler';
import { rateLimit } from '@/lib/rateLimit';
import { ThemePayloadSchema } from '@/lib/validators';
import type { UserTheme } from '@prisma/client';

function isUserTheme(value: unknown): value is UserTheme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import('@/lib/prisma');

  const row = await prisma.userThemePreference.findUnique({
    where: { userId: databaseUser.id },
    select: { theme: true },
  });

  return NextResponse.json({ theme: row?.theme ?? 'system' });
});

export const POST = createApiAuthHandler(async (databaseUser, request) => {
  const { prisma } = await import('@/lib/prisma');

  const rateLimitResult = await rateLimit(request, { limit: 10, windowMs: 60_000 });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.retryAfterMs ?? 1000) / 1000)) } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    const error = new ValidationError('Invalid theme payload');
    logError('theme:POST', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const parseResult = ThemePayloadSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError('Invalid theme payload');
    logError('theme:POST', { ...error, details: parseResult.error.issues });
    return NextResponse.json({ code: error.code, message: error.message, details: parseResult.error.issues }, { status: error.statusCode });
  }

  const { theme } = parseResult.data;

  try {
    await prisma.userThemePreference.upsert({
      where: { userId: databaseUser.id },
      create: {
        userId: databaseUser.id,
        theme,
      },
      update: {
        theme,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const dbError = new DatabaseError('Failed to save theme preference', error);
    logError('theme:POST', dbError);
    return NextResponse.json({ code: dbError.code, message: dbError.message }, { status: dbError.statusCode });
  }

  return NextResponse.json({ ok: true });
});