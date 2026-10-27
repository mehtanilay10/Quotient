import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const lastItem = items[items.length - 1];
  const middleItems = items.slice(0, -1);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex min-w-0 flex-wrap items-center gap-1 text-xs text-fg-muted", className)}
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-1 transition-colors hover:text-fg-default"
      >
        <Home className="h-3 w-3" aria-hidden="true" />
        <span className="sr-only">Home</span>
      </Link>
      {/* Wrap breadcrumb items on mobile instead of horizontal scroll */}
      {middleItems.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 shrink-0 text-fg-subtle" aria-hidden="true" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-fg-default">
              {item.label}
            </Link>
          ) : (
            <span className="text-fg-default" aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
      {lastItem && (
        <span className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 shrink-0 text-fg-subtle" aria-hidden="true" />
          {lastItem.href ? (
            <Link href={lastItem.href} className="truncate transition-colors hover:text-fg-default">
              {lastItem.label}
            </Link>
          ) : (
            <span className="truncate text-fg-default" aria-current="page">
              {lastItem.label}
            </span>
          )}
        </span>
      )}
    </nav>
  );
}
