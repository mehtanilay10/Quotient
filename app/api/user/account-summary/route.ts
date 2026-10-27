import { NextResponse } from "next/server";
import { createApiAuthHandler } from "@/lib/authMiddleware";
import { DatabaseError, logError } from "@/lib/errorHandler";

/**
 * Aggregated account summary for the profile page: when the account was
 * created and how many items the user has saved or completed. Kept as a
 * dedicated endpoint so the profile page never has to load progress,
 * bookmarks, and notes into the client just to show counts.
 */
export const GET = createApiAuthHandler(async (databaseUser) => {
  const { prisma } = await import("@/lib/prisma");

  try {
    const [user, progress, bookmarks, notes, offlineQueue] = await Promise.all([
      prisma.user.findUnique({
        where: { id: databaseUser.id },
        select: { createdAt: true, emailVerified: true },
      }),
      prisma.userProgress.count({ where: { userId: databaseUser.id } }),
      prisma.userBookmark.count({ where: { userId: databaseUser.id } }),
      prisma.userLessonNote.count({ where: { userId: databaseUser.id } }),
      prisma.offlineReadingQueue.count({ where: { userId: databaseUser.id } }),
    ]);

    return NextResponse.json({
      createdAt: user?.createdAt?.toISOString() ?? null,
      emailVerified: user?.emailVerified?.toISOString() ?? null,
      counts: { progress, bookmarks, notes, offlineQueue },
    });
  } catch (error) {
    const dbError = new DatabaseError("Failed to load account summary", error);
    logError("account-summary:GET", dbError);
    return NextResponse.json(
      { code: dbError.code, message: dbError.message },
      { status: dbError.statusCode }
    );
  }
});
