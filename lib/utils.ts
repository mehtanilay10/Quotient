import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Convert a string to a URL-safe slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Minimal shape needed to derive a heading anchor. */
interface HeadingLike {
  text?: string;
  anchor?: string;
}

/**
 * Derives stable, unique DOM ids for a list of headings.
 *
 * Both the table of contents and the heading renderer use this so their
 * anchors always match. Headings without an explicit `anchor` get a slug of
 * their text; duplicates get a numeric suffix (`-1`, `-2`, …). The result is
 * keyed by block index so callers can look an anchor up per rendered block.
 */
export function computeHeadingAnchors(
  headings: { index: number; block: HeadingLike }[]
): Map<number, string> {
  const seen = new Map<string, number>();
  const anchors = new Map<number, string>();
  for (const { index, block } of headings) {
    const base = block.anchor || slugify(block.text ?? "");
    if (!base) continue;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.set(index, count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

/** Capitalize the first letter of each word */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Estimate reading time from word count */
export function estimateReadingTime(text: string, wpm = 200): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wpm));
}

/** Format minutes to human-readable string */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/** Format hours with decimal to human-readable string */
export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (Number.isInteger(hours)) return `${hours}h`;
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return `${whole}h ${mins}min`;
}

/** Get difficulty label with proper casing */
export function difficultyLabel(difficulty: string): string {
  const map: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  return map[difficulty] ?? titleCase(difficulty);
}

/** Get difficulty color classes */
export function difficultyColorClass(difficulty: string): string {
  const map: Record<string, string> = {
    beginner: "bg-success-muted text-success-fg border-success-muted",
    intermediate: "bg-attention-muted text-attention-fg border-attention-muted",
    advanced: "bg-done-muted text-done-fg border-done-muted",
  };
  return map[difficulty] ?? "bg-canvas-subtle text-fg-muted border-border";
}

/** Truncate text to a max length, adding ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "…";
}

/** Get a percentage safely (returns 0 if denominator is 0) */
export function safePercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Pluralize a word */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural ?? singular + "s"}`;
}

/** Deep clone an object using JSON (primitives + plain objects only) */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Format a date string to readable format */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a date string to a relative time string (e.g., "2 days ago") */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(isoString);
}
