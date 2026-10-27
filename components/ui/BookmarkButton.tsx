"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { registerShortcut, unregisterShortcut } from "@/hooks/useKeyboardShortcuts";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import type { BookmarkItem } from "@/types";

export function BookmarkButton({
  item,
  enableShortcut = false,
}: {
  item: Omit<BookmarkItem, "id" | "addedAt">;
  /** Registers the global `b` shortcut for this button. */
  enableShortcut?: boolean;
}) {
  const { toggleBookmark, isBookmarked, isLoggedOut } = useBookmarks();
  const [showSignIn, setShowSignIn] = useState(false);
  const bookmarked = isBookmarked(item.slug, item.type);

  const handleClick = useCallback(() => {
    if (isLoggedOut) {
      setShowSignIn(true);
      return;
    }
    toggleBookmark(item);
  }, [isLoggedOut, item, toggleBookmark]);

  useEffect(() => {
    if (!enableShortcut) return;
    registerShortcut("b", "Add/remove current lesson bookmark", handleClick);
    return () => unregisterShortcut("b");
  }, [enableShortcut, handleClick]);

  return (
    <>
      <button
        onClick={handleClick}
        className={`no-print flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          bookmarked
            ? "border-accent-fg bg-accent-subtle text-accent-fg"
            : "border-border bg-canvas text-fg-muted hover:bg-canvas-subtle hover:text-fg-default"
        }`}
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
        aria-pressed={bookmarked}
      >
        <Bookmark
          className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`}
          aria-hidden="true"
        />
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </button>
      <div aria-live="polite" className="sr-only">
        {bookmarked ? "Bookmark removed" : "Bookmark added"}
      </div>
      {showSignIn && <SignInPrompt onDismiss={() => setShowSignIn(false)} />}
    </>
  );
}
