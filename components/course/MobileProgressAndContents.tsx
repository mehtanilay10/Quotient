'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { ProgressTracker } from '@/components/course/ProgressTracker';
import { LessonSidebar } from '@/components/layout/LessonSidebar';
import { cn } from '@/lib/utils';
import type { Module, LessonNavItem, ProgressCategory } from '@/types';

interface MobileProgressAndContentsProps {
  lessonSlug: string;
  moduleSlug: string;
  courseSlug: string;
  basePrefix?: string;
  allModuleLessonSlugs: string[];
  allCourseLessonSlugs?: string[];
  modules: Module[];
  lessonsByModule: Record<string, LessonNavItem[]>;
  category?: ProgressCategory;
  className?: string;
}

export function MobileProgressAndContents({
  lessonSlug,
  moduleSlug,
  courseSlug,
  basePrefix = 'courses',
  allModuleLessonSlugs,
  allCourseLessonSlugs,
  modules,
  lessonsByModule,
  category = 'lessons',
  className,
}: MobileProgressAndContentsProps) {
  const [contentsOpen, setContentsOpen] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-xl border border-border bg-canvas-subtle">
        <ProgressTracker
          lessonSlug={lessonSlug}
          moduleSlug={moduleSlug}
          allModuleLessonSlugs={allModuleLessonSlugs}
          allCourseLessonSlugs={allCourseLessonSlugs}
          category={category}
          className="border-0 bg-transparent rounded-none"
        />

        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setContentsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-fg-default transition-colors hover:text-accent-fg"
            aria-expanded={contentsOpen}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent-fg" aria-hidden="true" />
              Course Contents
            </span>
            {contentsOpen ? (
              <ChevronUp className="h-4 w-4 text-fg-subtle" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-fg-subtle" aria-hidden="true" />
            )}
          </button>

          {contentsOpen && (
            <div className="px-4 pb-4">
              <LessonSidebar
                currentModuleSlug={moduleSlug}
                currentLessonSlug={lessonSlug}
                courseSlug={courseSlug}
                basePrefix={basePrefix}
                modules={modules}
                lessonsByModule={lessonsByModule}
                category={category}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
