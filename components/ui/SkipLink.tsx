"use client";

import Link from "next/link";

export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-accent-fg focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
    >
      Skip to main content
    </Link>
  );
}
