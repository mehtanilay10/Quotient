"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-lg bg-canvas-inset", className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-8 h-8 w-64" />
      <div className="grid gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function LessonPageSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 shrink-0 lg:block p-4">
        <Skeleton className="mb-4 h-6 w-32" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="mb-2 h-4 w-full" />
        ))}
      </div>
      <div className="flex flex-1 min-w-0">
        <article className="mx-auto w-full max-w-[800px] min-w-0 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-4 h-6 w-48" />
          <Skeleton className="mb-4 h-10 w-3/4" />
          <Skeleton className="mb-8 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-2/3" />
        </article>
      </div>
    </div>
  );
}
