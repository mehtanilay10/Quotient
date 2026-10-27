"use client";

import { useEffect } from "react";

/**
 * Locks body scrolling while `isActive` is true, restoring the previous value
 * on deactivation/unmount.
 *
 * Modals previously did `document.body.style.overflow = ''` on close, which
 * clobbered any pre-existing inline overflow (for example a parent that had set
 * it to `hidden`) instead of restoring it. Saving the previous value keeps
 * nested/stacked locks correct.
 */
export function useBodyScrollLock(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    // Compensate for the removed scrollbar so the layout doesn't shift.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isActive]);
}
