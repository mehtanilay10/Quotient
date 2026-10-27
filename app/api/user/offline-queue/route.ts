import { NextResponse } from 'next/server';
import { createApiAuthHandler } from '@/lib/authMiddleware';
import { ValidationError, DatabaseError } from '@/lib/errorHandler';
import { logError } from '@/lib/errorHandler';
import { rateLimit } from '@/lib/rateLimit';
import { OfflineQueueDeleteSchema, OfflineQueueEntrySchema, OfflineQueuePayloadSchema } from '@/lib/validators';

export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import('@/lib/prisma');

  const rows = await prisma.offlineReadingQueue.findMany({
    where: { userId: databaseUser.id },
    orderBy: { queuedAt: 'desc' },
    select: {
      courseSlug: true,
      moduleSlug: true,
      lessonSlug: true,
      title: true,
      queuedAt: true,
    },
  });

  const queue = rows.map((row: { courseSlug: string; moduleSlug: string; lessonSlug: string; title: string; queuedAt: Date }) => ({
    courseSlug: row.courseSlug,
    moduleSlug: row.moduleSlug,
    lessonSlug: row.lessonSlug,
    title: row.title,
    queuedAt: row.queuedAt.toISOString(),
  }));

  return NextResponse.json({ queue });
});

export const POST = createApiAuthHandler(async (databaseUser, request) => {
  const { prisma } = await import('@/lib/prisma');

  const rateLimitResult = await rateLimit(request, { limit: 20, windowMs: 60_000 });
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
    const error = new ValidationError('Invalid offline queue payload');
    logError('offline-queue:POST', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const parseResult = OfflineQueuePayloadSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError('Invalid offline queue payload');
    logError('offline-queue:POST', { ...error, details: parseResult.error.issues });
    return NextResponse.json({ code: error.code, message: error.message, details: parseResult.error.issues }, { status: error.statusCode });
  }

  const payload = parseResult.data;

  // Accept both `{ entries: [...] }` and a single queue item. The fallback is
  // validated with the same entry schema so empty or oversized values are
  // rejected here instead of being silently persisted.
  let entries: Array<{ courseSlug: string; moduleSlug: string; lessonSlug: string; title: string }>;
  if (payload.entries) {
    entries = payload.entries;
  } else {
    const singleEntry = OfflineQueueEntrySchema.safeParse(rawBody);
    if (!singleEntry.success) {
      const error = new ValidationError('Invalid offline queue payload');
      logError('offline-queue:POST', { ...error, details: singleEntry.error.issues });
      return NextResponse.json(
        { code: error.code, message: error.message, details: singleEntry.error.issues },
        { status: error.statusCode }
      );
    }
    entries = [singleEntry.data];
  }

  try {
    if (entries.length > 0) {
      await prisma.offlineReadingQueue.createMany({
        data: entries.map((entry) => ({
          userId: databaseUser.id,
          courseSlug: entry.courseSlug,
          moduleSlug: entry.moduleSlug,
          lessonSlug: entry.lessonSlug,
          title: entry.title,
        })),
        skipDuplicates: true,
      });
    }
  } catch (error) {
    const dbError = new DatabaseError('Failed to save offline queue', error);
    logError('offline-queue:POST', dbError);
    return NextResponse.json({ code: dbError.code, message: dbError.message }, { status: dbError.statusCode });
  }

  return NextResponse.json({ ok: true });
});

export const DELETE = createApiAuthHandler(async (databaseUser, request) => {
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
    const error = new ValidationError('Invalid offline queue delete payload');
    logError('offline-queue:DELETE', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const parseResult = OfflineQueueDeleteSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError('Invalid offline queue delete payload');
    logError('offline-queue:DELETE', { ...error, details: parseResult.error.issues });
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const { courseSlug, moduleSlug, lessonSlug } = parseResult.data;

  try {
    const result = await prisma.offlineReadingQueue.deleteMany({
      where: {
        userId: databaseUser.id,
        courseSlug,
        moduleSlug,
        lessonSlug,
      },
    });
    // Report how many rows were removed so the client can tell a real delete
    // from a no-op (e.g. removing an item that no longer exists).
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (error) {
    const dbError = new DatabaseError('Failed to delete offline queue item', error);
    logError('offline-queue:DELETE', dbError);
    return NextResponse.json({ code: dbError.code, message: dbError.message }, { status: dbError.statusCode });
  }
});