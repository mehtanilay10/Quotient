"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocEntry } from "@/types";

interface TableOfContentsProps {
  entries: TocEntry[];
  className?: string;
}

export function TableOfContents({ entries, className }: TableOfContentsProps) {
  const [activeAnchor, setActiveAnchor] = useState<string>("");

  useEffect(() => {
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (obs) => {
        for (const entry of obs) {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    for (const e of entries) {
      const el = document.getElementById(e.anchor);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className={cn("text-sm", className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        On this page
      </p>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.anchor} style={{ paddingLeft: `${(entry.level - 2) * 12}px` }}>
            <a
              href={`#${entry.anchor}`}
              className={cn(
                "block rounded py-0.5 text-xs leading-snug transition-colors",
                activeAnchor === entry.anchor
                  ? "font-medium text-accent-fg"
                  : "text-fg-muted hover:text-fg-default"
              )}
              aria-current={activeAnchor === entry.anchor ? "location" : undefined}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
