"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/apiFetch";

type OfflineQueueItem = {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  title: string;
  queuedAt: string;
};

async function fetchQueueFromServer(): Promise<OfflineQueueItem[] | null> {
  try {
    const res = await fetch("/api/user/offline-queue");
    if (!res.ok) return null;
    const data = await res.json();
    return data.queue ?? [];
  } catch {
    return null;
  }
}

async function syncQueueToServer(item: OfflineQueueItem): Promise<void> {
  try {
    await apiFetch("/api/user/offline-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch (err) {
    logger.warn("useOfflineQueue", "Failed to sync to server", err);
  }
}

export function useOfflineQueue() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isLoggedOut = status === "unauthenticated";

  const [serverQueue, setServerQueue] = useState<OfflineQueueItem[] | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasLoadedQueueRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || hasLoadedQueueRef.current) return;
    hasLoadedQueueRef.current = true;
    let cancelled = false;
    fetchQueueFromServer().then((data) => {
      if (cancelled) return;
      if (data) {
        setServerQueue(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]); // intentionally ignore serverQueue to avoid refetch loops

  useEffect(() => {
    if (isLoggedOut) {
      setServerQueue(null);
      hasLoadedQueueRef.current = false;
    }
  }, [isLoggedOut]);

  const activeQueue = useMemo(
    () => (isLoggedIn && serverQueue ? serverQueue : []),
    [isLoggedIn, serverQueue]
  );

  const isQueued = useCallback(
    (courseSlug: string, moduleSlug: string, lessonSlug: string): boolean => {
      return activeQueue.some(
        (item) =>
          item.courseSlug === courseSlug &&
          item.moduleSlug === moduleSlug &&
          item.lessonSlug === lessonSlug
      );
    },
    [activeQueue]
  );

  const addToQueue = useCallback(
    (courseSlug: string, moduleSlug: string, lessonSlug: string, title: string) => {
      if (!isLoggedIn) return;
      const item: OfflineQueueItem = {
        courseSlug,
        moduleSlug,
        lessonSlug,
        title,
        queuedAt: new Date().toISOString(),
      };

      setServerQueue((prev) => {
        const next = prev
          ? [
              ...prev.filter(
                (q) =>
                  !(
                    q.courseSlug === courseSlug &&
                    q.moduleSlug === moduleSlug &&
                    q.lessonSlug === lessonSlug
                  )
              ),
              item,
            ]
          : [item];
        return next;
      });
      // Sync outside the state updater: updaters must be pure (React may run
      // them twice), so the network call happens after the state is committed.
      syncQueueToServer(item);
    },
    [isLoggedIn]
  );

  const removeFromQueue = useCallback(
    (courseSlug: string, moduleSlug: string, lessonSlug: string) => {
      if (!isLoggedIn) return;
      setServerQueue((prev) => {
        const next = prev
          ? prev.filter(
              (q) =>
                !(
                  q.courseSlug === courseSlug &&
                  q.moduleSlug === moduleSlug &&
                  q.lessonSlug === lessonSlug
                )
            )
          : [];
        return next;
      });
      apiFetch("/api/user/offline-queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, moduleSlug, lessonSlug }),
      }).catch(() => undefined);
    },
    [isLoggedIn]
  );

  return {
    queue: activeQueue,
    isQueued,
    addToQueue,
    removeFromQueue,
    mounted,
    isLoggedIn,
    isLoggedOut,
  };
}
