import { NextResponse } from 'next/server';
import { createApiAuthHandler } from '@/lib/authMiddleware';
import { ValidationError, DatabaseError } from '@/lib/errorHandler';
import { logError } from '@/lib/errorHandler';
import { rateLimit } from '@/lib/rateLimit';
import { LastPathPayloadSchema } from '@/lib/validators';

export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import('@/lib/prisma');

  const row = await prisma.userLastPath.findUnique({
    where: { userId: databaseUser.id },
    select: { path: true },
  });

  return NextResponse.json({ path: row?.path ?? null });
});

export const POST = createApiAuthHandler(async (databaseUser, request) => {
  const { prisma } = await import('@/lib/prisma');

  const rateLimitResult = await rateLimit(request, { limit: 30, windowMs: 60_000 });
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
    const error = new ValidationError('Invalid path payload');
    logError('last-path:POST', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const parseResult = LastPathPayloadSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError('Invalid path payload');
    logError('last-path:POST', { ...error, details: parseResult.error.issues });
    return NextResponse.json({ code: error.code, message: error.message, details: parseResult.error.issues }, { status: error.statusCode });
  }

  const { path } = parseResult.data;

  try {
    await prisma.userLastPath.upsert({
      where: { userId: databaseUser.id },
      create: {
        userId: databaseUser.id,
        path,
      },
      update: {
        path,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const dbError = new DatabaseError('Failed to save last path', error);
    logError('last-path:POST', dbError);
    return NextResponse.json({ code: dbError.code, message: dbError.message }, { status: dbError.statusCode });
  }

  return NextResponse.json({ ok: true });
});