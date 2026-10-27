"use client";

import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  label?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterBar({ label, options, value, onChange, className }: FilterBarProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
            value === option.value
              ? "border-accent-fg bg-accent-subtle text-accent-fg"
              : "border-border bg-canvas text-fg-muted hover:border-accent-fg hover:text-accent-fg dark:bg-canvas-subtle"
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                value === option.value
                  ? "bg-accent-fg/10 text-accent-fg"
                  : "bg-canvas-subtle text-fg-subtle"
              )}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
