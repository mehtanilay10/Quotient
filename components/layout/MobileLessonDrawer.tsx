'use client';

import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { LessonSidebar } from '@/components/layout/LessonSidebar';
import type { Module, Lesson, ProgressCategory } from '@/types';

interface MobileLessonDrawerProps {
  currentModuleSlug: string;
  currentLessonSlug: string;
  courseSlug?: string;
  modules: Module[];
  lessonsByModule: Record<string, Lesson[]>;
  category?: ProgressCategory;
}

export function MobileLessonDrawer({
  currentModuleSlug,
  currentLessonSlug,
  courseSlug,
  modules,
  lessonsByModule,
  category = 'lessons',
}: MobileLessonDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-canvas-subtle px-4 py-3 text-sm font-medium text-fg-default transition-colors hover:bg-canvas lg:hidden"
        aria-expanded={open}
        aria-controls="mobile-lesson-drawer"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent-fg" aria-hidden="true" />
          Course Contents
        </span>
        <span className="text-xs text-fg-subtle">Tap to expand</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-lesson-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Course navigation"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-canvas shadow-xl transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-fg-default">Course Contents</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
              aria-label="Close course navigation"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <LessonSidebar
              currentModuleSlug={currentModuleSlug}
              currentLessonSlug={currentLessonSlug}
              courseSlug={courseSlug}
              modules={modules}
              lessonsByModule={lessonsByModule}
              category={category}
            />
          </div>
        </div>
      </div>
    </>
  );
}
