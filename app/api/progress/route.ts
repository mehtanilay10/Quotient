import { NextResponse } from "next/server";
import { createApiAuthHandler } from "@/lib/authMiddleware";
import { ValidationError, DatabaseError } from "@/lib/errorHandler";
import { logError } from "@/lib/errorHandler";
import { rateLimit } from "@/lib/rateLimit";
import { ProgressEntrySchema, ProgressPayloadSchema } from "@/lib/validators";
import { clearCache, getCached, setCache } from "@/lib/cache";
import { lessons } from "@/content/lessons";
import { getModuleBySlug } from "@/content/modules";
import { getContentItemHref } from "@/lib/content-hrefs";
import type { ProgressCategory } from "@prisma/client";
import type { z } from "zod";

interface ProgressItem {
  lessonSlug: string;
  moduleSlug: string;
  completedAt: string;
  title: string;
  href: string;
  estimatedMinutes: number;
}

type ProgressEntryInput = z.infer<typeof ProgressEntrySchema>;

function progressCacheKey(userId: string): string {
  return `progress:${userId}`;
}

/**
 * Resolves the canonical, category-prefixed href for a stored progress row.
 * Uses the lesson's `courseSlug` (and the module's course as a fallback) so
 * links include both the category and the course segment.
 */
function buildLessonHref(
  category: ProgressCategory,
  moduleSlug: string,
  lessonSlug: string
): string {
  const lesson = lessons.find((l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug);
  if (lesson) {
    return getContentItemHref(lesson.courseSlug, lesson.moduleSlug, lesson.slug);
  }

  if (category === "questionAnswers") {
    // Legacy rows may still carry the old level-based module slug; the href
    // builder resolves the owning technology from the question slug.
    return getContentItemHref("question-answers", moduleSlug, lessonSlug);
  }

  const courseSlug = getModuleBySlug(moduleSlug)?.courseSlug;
  if (courseSlug) {
    return getContentItemHref(courseSlug, moduleSlug, lessonSlug);
  }

  return "/";
}

export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import("@/lib/prisma");

  const cacheKey = `progress:${databaseUser.id}`;
  const cached = await getCached<Record<string, ProgressItem[]>>(cacheKey);
  if (cached) {
    return NextResponse.json({ progress: cached });
  }

  const rows = await prisma.userProgress.findMany({
    where: { userId: databaseUser.id },
    orderBy: { completedAt: "desc" },
    select: {
      category: true,
      lessonSlug: true,
      moduleSlug: true,
      completedAt: true,
    },
  });

  const progress: Record<string, ProgressItem[]> = {};
  for (const row of rows) {
    if (!progress[row.category]) {
      progress[row.category] = [];
    }

    const lesson = lessons.find(
      (l) => l.moduleSlug === row.moduleSlug && l.slug === row.lessonSlug
    );
    const title = lesson?.title ?? row.lessonSlug.replace(/-/g, " ");

    progress[row.category].push({
      lessonSlug: row.lessonSlug,
      moduleSlug: row.moduleSlug,
      completedAt: row.completedAt.toISOString(),
      title,
      href: buildLessonHref(row.category, row.moduleSlug, row.lessonSlug),
      estimatedMinutes: lesson?.estimatedMinutes ?? 0,
    });
  }

  await setCache(cacheKey, progress, 30_000);
  return NextResponse.json({ progress });
});

export const POST = createApiAuthHandler(async (databaseUser, request) => {
  const { prisma } = await import("@/lib/prisma");

  const rateLimitResult = await rateLimit(request, { limit: 30, windowMs: 60_000 });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.retryAfterMs ?? 1000) / 1000)),
        },
      }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    const error = new ValidationError("Invalid progress payload");
    logError("progress:POST", error);
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  const parseResult = ProgressPayloadSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError("Invalid progress payload");
    logError("progress:POST", { ...error, details: parseResult.error.issues });
    return NextResponse.json(
      { code: error.code, message: error.message, details: parseResult.error.issues },
      { status: error.statusCode }
    );
  }

  const payload = parseResult.data;

  // Accept both `{ entries: [...] }` and a single entry object. The fallback
  // is validated with the same entry schema so empty or oversized values are
  // rejected here instead of being silently persisted.
  let entries: ProgressEntryInput[];
  if (payload.entries) {
    entries = payload.entries;
  } else {
    const singleEntry = ProgressEntrySchema.safeParse(rawBody);
    if (!singleEntry.success) {
      const error = new ValidationError("Invalid progress payload");
      logError("progress:POST", { ...error, details: singleEntry.error.issues });
      return NextResponse.json(
        { code: error.code, message: error.message, details: singleEntry.error.issues },
        { status: error.statusCode }
      );
    }
    entries = [singleEntry.data];
  }

  try {
    if (entries.length > 0) {
      await prisma.userProgress.createMany({
        data: entries.map((entry) => ({
          userId: databaseUser.id,
          category: entry.category,
          lessonSlug: entry.lessonSlug,
          moduleSlug: entry.moduleSlug,
        })),
        skipDuplicates: true,
      });
    }
    // Invalidate the cached GET so the new rows are visible immediately.
    await clearCache(progressCacheKey(databaseUser.id));
  } catch (error) {
    const dbError = new DatabaseError("Failed to save progress", error);
    logError("progress:POST", dbError);
    return NextResponse.json(
      { code: dbError.code, message: dbError.message },
      { status: dbError.statusCode }
    );
  }

  return NextResponse.json({ ok: true });
});

export const DELETE = createApiAuthHandler(async (databaseUser, request) => {
  const { prisma } = await import("@/lib/prisma");

  const rateLimitResult = await rateLimit(request, { limit: 10, windowMs: 60_000 });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.retryAfterMs ?? 1000) / 1000)),
        },
      }
    );
  }

  try {
    await prisma.userProgress.deleteMany({ where: { userId: databaseUser.id } });
    // Invalidate the cached GET so deleted rows do not reappear for 30s.
    await clearCache(progressCacheKey(databaseUser.id));
  } catch (error) {
    const dbError = new DatabaseError("Failed to delete progress", error);
    logError("progress:DELETE", dbError);
    return NextResponse.json(
      { code: dbError.code, message: dbError.message },
      { status: dbError.statusCode }
    );
  }

  return NextResponse.json({ ok: true });
});
