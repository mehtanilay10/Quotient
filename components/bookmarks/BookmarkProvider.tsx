"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { BookmarkState, BookmarkItem } from "@/types";
import { logger } from "@/lib/logger";
import { syncBookmarksToServer, syncUserData } from "@/lib/userSync";
import { retryWithBackoff } from "@/lib/retry";
import { apiFetch } from "@/lib/apiFetch";

const DEFAULT_BOOKMARKS: BookmarkState = { items: [] };

async function fetchBookmarksFromServer(): Promise<BookmarkState | null> {
  try {
    return await retryWithBackoff(
      async () => {
        const res = await apiFetch("/api/bookmarks");
        if (!res.ok) throw new Error(`Failed to fetch bookmarks: ${res.status}`);
        const data = await res.json();
        return { items: data.items || [] };
      },
      { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true }
    );
  } catch {
    return null;
  }
}

async function syncBookmarksToServerFn(bookmarks: BookmarkState): Promise<void> {
  try {
    await retryWithBackoff(
      async () => {
        const res = await apiFetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: bookmarks.items }),
        });
        if (!res.ok) {
          throw new Error(`Failed to sync bookmarks: ${res.status}`);
        }
      },
      { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true }
    );
  } catch (err) {
    logger.warn("useBookmarks", "Failed to sync to server", err);
  }
}

interface BookmarkContextValue {
  bookmarks: BookmarkState;
  setBookmarks: (updater: BookmarkState | ((prev: BookmarkState) => BookmarkState)) => void;
  resetBookmarks: () => void;
  addBookmark: (item: Omit<BookmarkItem, "id" | "addedAt">) => void;
  removeBookmark: (id: string) => void;
  toggleBookmark: (item: Omit<BookmarkItem, "id" | "addedAt">) => void;
  isBookmarked: (slug: string, type: BookmarkItem["type"]) => boolean;
  getBookmarksByType: (type: BookmarkItem["type"]) => BookmarkItem[];
  stats: {
    total: number;
    lessons: number;
    problems: number;
    questions: number;
    cheatsheet: number;
  };
  mounted: boolean;
  isLoggedIn: boolean;
  isLoggedOut: boolean;
}

const BookmarkContext = React.createContext<BookmarkContextValue | null>(null);

export function useBookmarks(): BookmarkContextValue {
  const context = React.useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isLoggedOut = status === "unauthenticated";

  const [serverBookmarks, setServerBookmarks] = useState<BookmarkState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncedToServer, setSyncedToServer] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [prevLoggedIn, setPrevLoggedIn] = useState(false);
  // Start at `false` (not `isLoggedIn`) so that when the session resolves to
  // authenticated — including on remounts where it is already authenticated —
  // the login transition always fires and local data is synced to the server.
  const serverBookmarksRef = useRef(serverBookmarks);
  serverBookmarksRef.current = serverBookmarks;
  // Guard against re-syncing the same snapshot repeatedly.
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !prevLoggedIn) {
      syncUserData();
    }
    setPrevLoggedIn(isLoggedIn);
  }, [isLoggedIn, prevLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || serverBookmarks) return;
    setIsInitialLoad(true);
    setSyncedToServer(false);
    let cancelled = false;
    fetchBookmarksFromServer().then((data) => {
      if (cancelled) return;
      if (data) {
        setServerBookmarks(data);
        lastSyncedRef.current = JSON.stringify(data);
      }
      setIsInitialLoad(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, serverBookmarks]);

  useEffect(() => {
    if (!isLoggedIn || !serverBookmarks || isInitialLoad) return;
    // Only sync if the snapshot actually changed since the last sync.
    const snapshot = JSON.stringify(serverBookmarks);
    if (snapshot === lastSyncedRef.current) return;
    lastSyncedRef.current = snapshot;
    setSyncedToServer(false);
    syncBookmarksToServerFn(serverBookmarks).then(() => setSyncedToServer(true));
  }, [isLoggedIn, serverBookmarks, isInitialLoad]);

  useEffect(() => {
    if (isLoggedOut) {
      setServerBookmarks(null);
      setSyncedToServer(false);
      setIsInitialLoad(true);
      // Reset the snapshot guard so a different account logging in on this
      // device always performs a fresh fetch and sync.
      lastSyncedRef.current = null;
    }
  }, [isLoggedOut]);

  const activeBookmarks = isLoggedIn && serverBookmarks ? serverBookmarks : DEFAULT_BOOKMARKS;

  const setActiveBookmarks = useCallback(
    (updater: BookmarkState | ((prev: BookmarkState) => BookmarkState)) => {
      if (!isLoggedIn) return;
      setServerBookmarks((prev) => {
        const current = prev ?? DEFAULT_BOOKMARKS;
        if (typeof updater === "function") {
          return (updater as (prev: BookmarkState) => BookmarkState)(current);
        }
        return updater;
      });
    },
    [isLoggedIn]
  );

  const addBookmark = useCallback(
    (item: Omit<BookmarkItem, "id" | "addedAt">) => {
      if (!isLoggedIn) return;
      setActiveBookmarks((prev) => {
        const exists = prev.items.some((b) => b.slug === item.slug && b.type === item.type);
        if (exists) return prev;
        const newItem: BookmarkItem = {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          addedAt: new Date().toISOString(),
        };
        return { ...prev, items: [...prev.items, newItem] };
      });
    },
    [setActiveBookmarks, isLoggedIn]
  );

  const removeBookmark = useCallback(
    (id: string) => {
      if (!isLoggedIn) return;
      setActiveBookmarks((prev) => ({
        ...prev,
        items: prev.items.filter((b) => b.id !== id),
      }));
    },
    [setActiveBookmarks, isLoggedIn]
  );

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, "id" | "addedAt">) => {
      if (!isLoggedIn) return;
      const exists = activeBookmarks.items.some(
        (b) => b.slug === item.slug && b.type === item.type
      );
      if (exists) {
        const existing = activeBookmarks.items.find(
          (b) => b.slug === item.slug && b.type === item.type
        );
        if (existing) {
          removeBookmark(existing.id);
        }
      } else {
        addBookmark(item);
      }
    },
    [activeBookmarks, addBookmark, removeBookmark, isLoggedIn]
  );

  const isBookmarked = useCallback(
    (slug: string, type: BookmarkItem["type"]): boolean => {
      return activeBookmarks.items.some((b) => b.slug === slug && b.type === type);
    },
    [activeBookmarks]
  );

  const getBookmarksByType = useCallback(
    (type: BookmarkItem["type"]): BookmarkItem[] => {
      return activeBookmarks.items.filter((b) => b.type === type);
    },
    [activeBookmarks]
  );

  const stats = useMemo(() => {
    return {
      total: activeBookmarks.items.length,
      lessons: activeBookmarks.items.filter((b) => b.type === "lesson").length,
      problems: activeBookmarks.items.filter((b) => b.type === "problem").length,
      questions: activeBookmarks.items.filter((b) => b.type === "questionAnswer").length,
      cheatsheet: activeBookmarks.items.filter((b) => b.type === "cheatsheet").length,
    };
  }, [activeBookmarks]);

  const resetBookmarks = useCallback(() => {
    if (!isLoggedIn) return;
    setServerBookmarks(DEFAULT_BOOKMARKS);
    // Prevent the sync effect from re-POSTing the empty snapshot.
    lastSyncedRef.current = JSON.stringify(DEFAULT_BOOKMARKS);
    // The POST endpoint is insert-only (it can never delete rows), so a reset
    // must go through the DELETE endpoint or the bookmarks would reappear on
    // the next fetch.
    retryWithBackoff(
      async () => {
        const res = await apiFetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        });
        if (!res.ok) {
          throw new Error(`Failed to reset bookmarks: ${res.status}`);
        }
      },
      { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true }
    ).catch((err) => {
      logger.warn("BookmarkProvider", "Failed to reset bookmarks on server", err);
    });
  }, [isLoggedIn]);

  const value = useMemo(
    () => ({
      bookmarks: activeBookmarks,
      setBookmarks: setActiveBookmarks,
      resetBookmarks,
      addBookmark,
      removeBookmark,
      toggleBookmark,
      isBookmarked,
      getBookmarksByType,
      stats,
      mounted,
      isLoggedIn,
      isLoggedOut,
    }),
    [
      activeBookmarks,
      setActiveBookmarks,
      resetBookmarks,
      addBookmark,
      removeBookmark,
      toggleBookmark,
      isBookmarked,
      getBookmarksByType,
      stats,
      mounted,
      isLoggedIn,
      isLoggedOut,
    ]
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}
