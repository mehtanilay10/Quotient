"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloudOff, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/apiFetch";
import { getContentItemHref } from "@/lib/content-hrefs";
import { EmptyState } from "@/components/ui/EmptyState";

interface QueueItem {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  title: string;
  queuedAt: string;
}

export function OfflineQueueClient() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/offline-queue");
        if (res.ok) {
          const data = await res.json();
          setQueue(data.queue || []);
        }
      } catch (err) {
        logger.error("OfflineQueueClient", "Failed to fetch offline queue:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRemove = async (item: QueueItem) => {
    const previous = queue;
    setQueue((prev) =>
      prev.filter(
        (q) =>
          !(
            q.courseSlug === item.courseSlug &&
            q.moduleSlug === item.moduleSlug &&
            q.lessonSlug === item.lessonSlug
          )
      )
    );
    try {
      // apiFetch attaches the x-csrf-token header required by the API.
      const res = await apiFetch("/api/user/offline-queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: item.courseSlug,
          moduleSlug: item.moduleSlug,
          lessonSlug: item.lessonSlug,
        }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
    } catch (err) {
      logger.error("OfflineQueueClient", "Failed to remove offline item:", err);
      setQueue(previous);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading offline queue">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-canvas-inset" />
        ))}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<CloudOff className="h-10 w-10" aria-hidden="true" />}
        title="Nothing saved offline"
        description="Queue a lesson for offline reading and it will appear here, available without a connection."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {queue.map((item) => {
        const href = getContentItemHref(item.courseSlug, item.moduleSlug, item.lessonSlug);
        return (
          <li
            key={`${item.courseSlug}-${item.moduleSlug}-${item.lessonSlug}`}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-4 py-3 transition-colors hover:border-accent-fg"
          >
            <Link href={href} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg-default group-hover:text-accent-fg transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-fg-muted">Queued {formatRelativeTime(item.queuedAt)}</p>
            </Link>
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="shrink-0 rounded-md p-2 text-fg-subtle transition-colors hover:bg-danger-subtle hover:text-danger-fg"
              aria-label={`Remove offline save: ${item.title}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
