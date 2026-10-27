"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
  size = "md",
  autoFocus = false,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
        )}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-lg border border-border bg-canvas text-fg-default placeholder:text-fg-subtle",
          "transition-colors focus:border-accent-fg focus:outline-none focus:ring-2 focus:ring-accent-fg/20",
          size === "sm" ? "py-1.5 pl-8 pr-8 text-sm" : "py-2 pl-10 pr-10 text-sm",
          "dark:bg-canvas-subtle"
        )}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted transition-colors hover:text-fg-default"
          )}
          aria-label="Clear search"
        >
          <X className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      )}
    </div>
  );
}
