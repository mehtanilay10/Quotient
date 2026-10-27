import { NextResponse } from 'next/server';
import { createApiAuthHandler } from '@/lib/authMiddleware';
import { ValidationError, DatabaseError, logError } from '@/lib/errorHandler';
import { rateLimit } from '@/lib/rateLimit';
import { clearCache } from '@/lib/cache';

/** The account data groups that can be reset from the danger zone. */
const RESET_TARGETS = ['progress', 'bookmarks', 'notes', 'offline'] as const;
type ResetTarget = (typeof RESET_TARGETS)[number];

function isResetTarget(value: unknown): value is ResetTarget {
  return typeof value === 'string' && (RESET_TARGETS as readonly string[]).includes(value);
}

/**
 * Permanently deletes one group of the user's saved data. Scoped to the
 * authenticated user, rate-limited, and explicit about what it removes so the
 * client can present a precise confirmation.
 */
export const DELETE = createApiAuthHandler(async (databaseUser, request) => {
  const { prisma } = await import('@/lib/prisma');

  const rateLimitResult = await rateLimit(request, { limit: 5, windowMs: 60_000 });
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
    const error = new ValidationError('Invalid reset payload');
    logError('account-reset:DELETE', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const target = (rawBody as Record<string, unknown>)?.target;
  if (!isResetTarget(target)) {
    const error = new ValidationError('Unknown reset target');
    logError('account-reset:DELETE', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  try {
    switch (target) {
      case 'progress':
        await prisma.userProgress.deleteMany({ where: { userId: databaseUser.id } });
        await clearCache(`progress:${databaseUser.id}`);
        break;
      case 'bookmarks':
        await prisma.userBookmark.deleteMany({ where: { userId: databaseUser.id } });
        await clearCache(`bookmarks:${databaseUser.id}`);
        break;
      case 'notes':
        await prisma.userLessonNote.deleteMany({ where: { userId: databaseUser.id } });
        break;
      case 'offline':
        await prisma.offlineReadingQueue.deleteMany({ where: { userId: databaseUser.id } });
        break;
    }
  } catch (error) {
    const dbError = new DatabaseError(`Failed to reset ${target}`, error);
    logError('account-reset:DELETE', dbError);
    return NextResponse.json({ code: dbError.code, message: dbError.message }, { status: dbError.statusCode });
  }

  return NextResponse.json({ ok: true });
});
