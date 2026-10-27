import { NextResponse } from 'next/server';
import { createApiAuthHandler } from '@/lib/authMiddleware';
import { ValidationError, DatabaseError } from '@/lib/errorHandler';
import { logError } from '@/lib/errorHandler';
import { rateLimit } from '@/lib/rateLimit';
import type { UserPreference } from '@prisma/client';

type PreferencesPayload = Partial<Pick<UserPreference, 'fontSize' | 'density' | 'codeFontSize' | 'reducedMotion' | 'autoExpandCode' | 'showCompleted' | 'defaultLanding'>>;

function isValidPreference(key: string, value: unknown): boolean {
  if (key === 'reducedMotion' || key === 'autoExpandCode' || key === 'showCompleted') {
    return typeof value === 'boolean';
  }
  if (key === 'fontSize' || key === 'density' || key === 'codeFontSize' || key === 'defaultLanding') {
    return typeof value === 'string' || value === null;
  }
  return false;
}

export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import('@/lib/prisma');

  const row = await prisma.userPreference.findUnique({
    where: { userId: databaseUser.id },
  });

  return NextResponse.json({
    fontSize: row?.fontSize ?? null,
    density: row?.density ?? null,
    codeFontSize: row?.codeFontSize ?? null,
    reducedMotion: row?.reducedMotion ?? false,
    autoExpandCode: row?.autoExpandCode ?? true,
    showCompleted: row?.showCompleted ?? true,
    defaultLanding: row?.defaultLanding ?? null,
  });
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

  const body = await request.json().catch(() => null) as PreferencesPayload | null;
  if (!body || typeof body !== 'object') {
    const error = new ValidationError('Invalid payload');
    logError('preferences:POST', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const allowedKeys: (keyof PreferencesPayload)[] = ['fontSize', 'density', 'codeFontSize', 'reducedMotion', 'autoExpandCode', 'showCompleted', 'defaultLanding'];
  const updates: Record<string, unknown> = {};

  for (const key of allowedKeys) {
    const value = body[key];
    if (value !== undefined && isValidPreference(key, value)) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    const error = new ValidationError('No valid fields to update');
    logError('preferences:POST', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  let data: UserPreference;
  try {
    data = await prisma.userPreference.upsert({
      where: { userId: databaseUser.id },
      create: {
        userId: databaseUser.id,
        ...(updates as PreferencesPayload),
      },
      update: {
        ...(updates as PreferencesPayload),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const dbError = new DatabaseError('Failed to save preferences', error);
    logError('preferences:POST', dbError);
    return NextResponse.json({ code: dbError.code, message: dbError.message }, { status: dbError.statusCode });
  }

  return NextResponse.json({
    fontSize: data.fontSize ?? null,
    density: data.density ?? null,
    codeFontSize: data.codeFontSize ?? null,
    reducedMotion: data.reducedMotion ?? false,
    autoExpandCode: data.autoExpandCode ?? true,
    showCompleted: data.showCompleted ?? true,
    defaultLanding: data.defaultLanding ?? null,
  });
});