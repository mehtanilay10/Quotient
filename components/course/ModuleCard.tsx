import Link from "next/link";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn, formatHours } from "@/lib/utils";
import type { Module } from "@/types";

interface ModuleCardProps {
  module: Module;
  courseSlug?: string;
  basePrefix?: string;
  lessonCount?: number;
  completedCount?: number;
  className?: string;
  variant?: "default" | "compact";
}

export function ModuleCard({
  module,
  courseSlug,
  basePrefix = "courses",
  lessonCount,
  completedCount,
  className,
  variant = "default",
}: ModuleCardProps) {
  const moduleHref = courseSlug
    ? `/${basePrefix}/${courseSlug}/${module.slug}`
    : `/${basePrefix}/${module.slug}`;
  const hasProgress = completedCount !== undefined && lessonCount && lessonCount > 0;
  const progressPercent = hasProgress ? Math.round((completedCount! / lessonCount!) * 100) : 0;

  if (variant === "compact") {
    return (
      <Link
        href={moduleHref}
        className={cn(
          "flex items-center gap-3 rounded-lg border border-border bg-canvas p-3",
          "transition-all hover:border-accent-fg hover:shadow-sm dark:bg-canvas-subtle",
          className
        )}
      >
        <span className="text-2xl leading-none" aria-hidden="true">
          {module.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg-default">{module.title}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <DifficultyBadge difficulty={module.difficulty} />
            <span className="text-xs text-fg-subtle">{formatHours(module.estimatedHours)}</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href={moduleHref}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-canvas p-5",
        "transition-all hover:border-accent-fg hover:shadow-md dark:bg-canvas-subtle",
        "animate-fade-in",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {module.icon}
        </span>
        <div className="flex items-center gap-2">
          {module.isOptional && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-subtle">
              Optional
            </span>
          )}
          <DifficultyBadge difficulty={module.difficulty} />
        </div>
      </div>

      <h3 className="mb-1 font-semibold text-fg-default group-hover:text-accent-fg transition-colors">
        {module.title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-fg-muted line-clamp-4">
        {module.description}
      </p>

      <div className="mt-auto">
        {/* Tags */}
        {(module.tags?.length ?? 0) > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {(module.tags ?? []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-canvas-subtle px-2 py-0.5 text-xs text-fg-subtle border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {lessonCount ?? module.lessonSlugs?.length ?? 0} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatHours(module.estimatedHours)}
            </span>
          </div>
          {module.skipLabel && <span className="text-fg-subtle italic">{module.skipLabel}</span>}
        </div>

        {/* Progress bar */}
        {hasProgress && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-fg-subtle mb-1">
              <span>
                {completedCount}/{lessonCount} completed
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-canvas-inset overflow-hidden">
              <div
                className="h-full rounded-full bg-success-emphasis transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
