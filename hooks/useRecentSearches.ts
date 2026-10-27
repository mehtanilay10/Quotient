"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const STORAGE_KEY = "quotient:recent-searches";
const MAX_RECENT = 5;

/**
 * Tracks the user's most recent search queries in `localStorage`.
 *
 * Search terms are personal and low-stakes, so they live entirely on the client
 * (no DB sync): this keeps the search box responsive and works for logged-out
 * users too. Entries are de-duplicated case-insensitively and capped at
 * `MAX_RECENT`, newest first.
 */
export function useRecentSearches() {
  const [recent, setRecent] = useLocalStorage<string[]>(STORAGE_KEY, []);

  const addRecent = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setRecent((prev) => {
        const withoutDuplicate = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
        return [trimmed, ...withoutDuplicate].slice(0, MAX_RECENT);
      });
    },
    [setRecent]
  );

  const clearRecent = useCallback(() => {
    setRecent([]);
  }, [setRecent]);

  return { recent, addRecent, clearRecent };
}
