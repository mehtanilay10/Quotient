import { NextResponse } from "next/server";
import { createApiAuthHandler } from "@/lib/authMiddleware";
import { ValidationError, DatabaseError } from "@/lib/errorHandler";
import { logError } from "@/lib/errorHandler";
import { rateLimit } from "@/lib/rateLimit";
import { BookmarkDeleteSchema, BookmarkEntrySchema, BookmarkPayloadSchema } from "@/lib/validators";
import { clearCache, getCached, setCache } from "@/lib/cache";
import type { BookmarkType } from "@prisma/client";

function bookmarksCacheKey(userId: string): string {
  return `bookmarks:${userId}`;
}

export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import("@/lib/prisma");

  const cacheKey = `bookmarks:${databaseUser.id}`;
  const cached =
    await getCached<
      Array<{
        id: string;
        type: string;
        slug: string;
        title: string;
        courseSlug: string;
        moduleSlug: string;
        addedAt: string;
      }>
    >(cacheKey);
  if (cached) {
    return NextResponse.json({ items: cached });
  }

  const rows = await prisma.userBookmark.findMany({
    where: { userId: databaseUser.id },
    orderBy: { addedAt: "desc" },
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      courseSlug: true,
      moduleSlug: true,
      addedAt: true,
    },
  });

  const items = rows.map(
    (row: {
      id: string;
      type: BookmarkType;
      slug: string;
      title: string;
      courseSlug: string;
      moduleSlug: string;
      addedAt: Date;
    }) => ({
      id: row.id,
      type: row.type,
      slug: row.slug,
      title: row.title,
      courseSlug: row.courseSlug,
      moduleSlug: row.moduleSlug,
      addedAt: row.addedAt.toISOString(),
    })
  );

  await setCache(cacheKey, items, 30_000);
  return NextResponse.json({ items });
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
    const error = new ValidationError("Invalid bookmark payload");
    logError("bookmarks:POST", error);
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  const parseResult = BookmarkPayloadSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError("Invalid bookmark payload");
    logError("bookmarks:POST", { ...error, details: parseResult.error.issues });
    return NextResponse.json(
      { code: error.code, message: error.message, details: parseResult.error.issues },
      { status: error.statusCode }
    );
  }

  const payload = parseResult.data;

  // Accept both `{ items: [...] }` and a single bookmark object. The fallback
  // is validated with the same entry schema so empty or oversized values are
  // rejected here instead of being silently persisted.
  let items: Array<{
    type: BookmarkType;
    slug: string;
    title: string;
    courseSlug: string;
    moduleSlug: string;
  }>;
  if (payload.items) {
    items = payload.items;
  } else {
    const singleItem = BookmarkEntrySchema.safeParse(rawBody);
    if (!singleItem.success) {
      const error = new ValidationError("Invalid bookmark payload");
      logError("bookmarks:POST", { ...error, details: singleItem.error.issues });
      return NextResponse.json(
        { code: error.code, message: error.message, details: singleItem.error.issues },
        { status: error.statusCode }
      );
    }
    items = [singleItem.data];
  }

  try {
    if (items.length > 0) {
      await prisma.userBookmark.createMany({
        data: items.map((item) => ({
          userId: databaseUser.id,
          type: item.type,
          slug: item.slug,
          title: item.title,
          courseSlug: item.courseSlug,
          moduleSlug: item.moduleSlug,
        })),
        skipDuplicates: true,
      });
    }
    // Invalidate the cached GET so the new rows are visible immediately.
    await clearCache(bookmarksCacheKey(databaseUser.id));
  } catch (error) {
    const dbError = new DatabaseError("Failed to save bookmarks", error);
    logError("bookmarks:POST", dbError);
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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    const error = new ValidationError("Invalid bookmark delete payload");
    logError("bookmarks:DELETE", error);
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  const cacheKey = bookmarksCacheKey(databaseUser.id);

  // `{ all: true }` removes every bookmark for the user (used by
  // "clear all" flows). Otherwise a single `{ slug, type }` is required.
  if (rawBody && typeof rawBody === "object" && (rawBody as Record<string, unknown>).all === true) {
    try {
      const result = await prisma.userBookmark.deleteMany({ where: { userId: databaseUser.id } });
      await clearCache(cacheKey);
      return NextResponse.json({ ok: true, deleted: result.count });
    } catch (error) {
      const dbError = new DatabaseError("Failed to delete bookmarks", error);
      logError("bookmarks:DELETE", dbError);
      return NextResponse.json(
        { code: dbError.code, message: dbError.message },
        { status: dbError.statusCode }
      );
    }
  }

  const parseResult = BookmarkDeleteSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const error = new ValidationError("Invalid bookmark delete payload");
    logError("bookmarks:DELETE", { ...error, details: parseResult.error.issues });
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  const { slug, type } = parseResult.data;

  try {
    const result = await prisma.userBookmark.deleteMany({
      where: {
        userId: databaseUser.id,
        slug,
        type,
      },
    });
    await clearCache(cacheKey);
    // Report how many rows were removed so the client can tell a real delete
    // from a no-op (e.g. deleting a slug that no longer exists).
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (error) {
    const dbError = new DatabaseError("Failed to delete bookmarks", error);
    logError("bookmarks:DELETE", dbError);
    return NextResponse.json(
      { code: dbError.code, message: dbError.message },
      { status: dbError.statusCode }
    );
  }
});
