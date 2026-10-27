import { NextResponse } from 'next/server';
import { createApiAuthHandler } from '@/lib/authMiddleware';
import { ValidationError, DatabaseError } from '@/lib/errorHandler';
import { logError } from '@/lib/errorHandler';
import { rateLimit } from '@/lib/rateLimit';
import { NoteDeleteSchema, NotePayloadSchema } from '@/lib/validators';
import { getLessonBySlug } from '@/lib/content';
import { getContentItemHref } from '@/lib/content-hrefs';

export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import('@/lib/prisma');

  const rows = await prisma.userLessonNote.findMany({
    where: { userId: databaseUser.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      courseSlug: true,
      moduleSlug: true,
      lessonSlug: true,
      content: true,
      updatedAt: true,
    },
  });

  // Resolve lesson titles + canonical hrefs on the server so the notes page
  // does not need to import content data into the client bundle.
  const notes = rows.map((row: { courseSlug: string; moduleSlug: string; lessonSlug: string; content: string; updatedAt: Date }) => {
    const lesson = getLessonBySlug(row.lessonSlug, row.courseSlug);
    return {
      courseSlug: row.courseSlug,
      moduleSlug: row.moduleSlug,
      lessonSlug: row.lessonSlug,
      content: row.content,
      updatedAt: row.updatedAt.toISOString(),
      title: lesson?.title ?? row.lessonSlug.replace(/-/g, ' '),
      href: getContentItemHref(row.courseSlug, row.moduleSlug, row.lessonSlug),
    };
  });

  return NextResponse.json({ notes });
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
    const error = new ValidationError('Invalid note payload');
    logError('notes:POST', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const parseResult = NotePayloadSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError('Invalid note payload');
    logError('notes:POST', { ...error, details: parseResult.error.issues });
    return NextResponse.json({ code: error.code, message: error.message, details: parseResult.error.issues }, { status: error.statusCode });
  }

  const { courseSlug, moduleSlug, lessonSlug, content } = parseResult.data;

  try {
    await prisma.userLessonNote.upsert({
      where: {
        userId_courseSlug_moduleSlug_lessonSlug: {
          userId: databaseUser.id,
          courseSlug,
          moduleSlug,
          lessonSlug,
        },
      },
      create: {
        userId: databaseUser.id,
        courseSlug,
        moduleSlug,
        lessonSlug,
        content,
      },
      update: {
        content,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const dbError = new DatabaseError('Failed to save note', error);
    logError('notes:POST', dbError);
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
    const error = new ValidationError('Invalid note delete payload');
    logError('notes:DELETE', error);
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const parseResult = NoteDeleteSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError('Invalid note delete payload');
    logError('notes:DELETE', { ...error, details: parseResult.error.issues });
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.statusCode });
  }

  const { courseSlug, moduleSlug, lessonSlug } = parseResult.data;

  try {
    const result = await prisma.userLessonNote.deleteMany({
      where: {
        userId: databaseUser.id,
        courseSlug,
        moduleSlug,
        lessonSlug,
      },
    });
    // Report how many rows were removed so the client can tell a real delete
    // from a no-op (e.g. deleting a note that no longer exists).
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (error) {
    const dbError = new DatabaseError('Failed to delete note', error);
    logError('notes:DELETE', dbError);
    return NextResponse.json({ code: dbError.code, message: dbError.message }, { status: dbError.statusCode });
  }
});