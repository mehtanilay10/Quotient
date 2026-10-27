"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkX } from "lucide-react";
import Link from "next/link";
import { cn, formatRelativeTime } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/apiFetch";
import { getContentItemHref } from "@/lib/content-hrefs";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/user/StatCard";

interface BookmarkItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  courseSlug: string;
  moduleSlug: string;
  addedAt: string;
}

function bookmarkHref(item: BookmarkItem): string {
  if (item.type === "questionAnswer") {
    return getContentItemHref("question-answers", item.moduleSlug, item.slug);
  }
  return getContentItemHref(item.courseSlug, item.moduleSlug, item.slug);
}

const TYPE_LABELS: Record<string, string> = {
  lesson: "Lesson",
  problem: "Problem",
  questionAnswer: "Question Answer",
  cheatsheet: "Cheat Sheet",
};

type FilterId = "all" | "lesson" | "problem" | "questionAnswer" | "cheatsheet";

export function BookmarksClient() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/bookmarks");
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.items || []);
        }
      } catch (err) {
        logger.error("BookmarksClient", "Failed to fetch bookmarks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filters = useMemo(() => {
    const present = new Set(bookmarks.map((b) => b.type));
    const ids: FilterId[] = ["all", "lesson", "problem", "questionAnswer", "cheatsheet"];
    return ids.filter((id) => id === "all" || present.has(id));
  }, [bookmarks]);

  const filtered = useMemo(
    () => (filter === "all" ? bookmarks : bookmarks.filter((b) => b.type === filter)),
    [bookmarks, filter]
  );

  const handleRemove = async (item: BookmarkItem) => {
    setRemovingId(item.id);
    const previous = bookmarks;
    setBookmarks((prev) => prev.filter((b) => b.id !== item.id));
    try {
      // apiFetch attaches the x-csrf-token header required by the API.
      const res = await apiFetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type, slug: item.slug }),
      });
      if (!res.ok) throw new Error("Failed to remove bookmark");
    } catch (err) {
      logger.error("BookmarksClient", "Failed to remove bookmark:", err);
      setBookmarks(previous);
    } finally {
      setRemovingId(null);
    }
  };

  const byType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bookmarks) counts[b.type] = (counts[b.type] ?? 0) + 1;
    return counts;
  }, [bookmarks]);

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading bookmarks">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-canvas-inset" />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="h-10 w-10" aria-hidden="true" />}
        title="No bookmarks yet"
        description="Save lessons, problems, and question answers to find them again quickly."
        action={
          <Link
            href="/"
            className="rounded-lg bg-accent-emphasis px-4 py-2 text-sm font-medium text-accent-fg"
          >
            Browse content
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Bookmarks" value={bookmarks.length} icon={Bookmark} tone="accent" />
        <StatCard label="Lessons" value={byType.lesson ?? 0} icon={Bookmark} tone="success" />
        <StatCard label="Problems" value={byType.problem ?? 0} icon={Bookmark} tone="done" />
        <StatCard
          label="Question Answers"
          value={byType.questionAnswer ?? 0}
          icon={Bookmark}
          tone="attention"
        />
      </div>

      {filters.length > 2 && (
        <div
          className="flex flex-wrap gap-1 rounded-xl border border-border bg-canvas p-1"
          role="tablist"
          aria-label="Filter bookmarks"
        >
          {filters.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                filter === id
                  ? "bg-accent-emphasis text-accent-fg"
                  : "text-fg-muted hover:text-fg-default"
              )}
            >
              {id === "all"
                ? `All (${bookmarks.length})`
                : `${TYPE_LABELS[id]}s (${byType[id] ?? 0})`}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookmarkX className="h-10 w-10" aria-hidden="true" />}
          title="Nothing in this category"
          description="Try a different filter to see your other bookmarks."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((bookmark) => {
            const href = bookmarkHref(bookmark);
            return (
              <li
                key={bookmark.id}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-4 py-3 transition-colors hover:border-accent-fg"
              >
                <Link href={href} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg-default group-hover:text-accent-fg transition-colors truncate">
                    {bookmark.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
                    <span className="rounded-full bg-canvas-inset px-2 py-0.5 font-medium">
                      {TYPE_LABELS[bookmark.type] ?? bookmark.type}
                    </span>
                    <span>{formatRelativeTime(bookmark.addedAt)}</span>
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(bookmark)}
                  disabled={removingId === bookmark.id}
                  className="shrink-0 rounded-md p-2 text-fg-subtle transition-colors hover:bg-danger-subtle hover:text-danger-fg disabled:opacity-50"
                  aria-label={`Remove bookmark: ${bookmark.title}`}
                >
                  <BookmarkX className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
