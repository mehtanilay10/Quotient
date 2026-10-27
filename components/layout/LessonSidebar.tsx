'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useProgress } from '@/hooks/useProgress';
import type { Module, LessonNavItem, ProgressCategory } from '@/types';

interface LessonSidebarProps {
  currentModuleSlug: string;
  currentLessonSlug: string;
  courseSlug?: string;
  basePrefix?: string;
  modules: Module[];
  lessonsByModule: Record<string, LessonNavItem[]>;
  category?: ProgressCategory;
}

export function LessonSidebar({
  currentModuleSlug,
  currentLessonSlug,
  courseSlug,
  basePrefix = 'courses',
  modules,
  lessonsByModule,
  category = 'lessons',
}: LessonSidebarProps) {
  const { isCompleted } = useProgress();

  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    s.add(currentModuleSlug);
    return s;
  });

  const toggleModule = (slug: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const lessonHref = (modSlug: string, lessonSlug: string) =>
    courseSlug
      ? `/${basePrefix}/${courseSlug}/${modSlug}/${lessonSlug}`
      : `/${basePrefix}/${modSlug}/${lessonSlug}`;

  return (
    <nav aria-label="Course navigation" className="w-full text-sm">
      <ul className="space-y-1">
        {modules.map((mod) => {
          const isOpen = openModules.has(mod.slug);
          const lessons = lessonsByModule[mod.slug] ?? [];
          const completedCount = lessons.filter((l) => isCompleted(l.slug, category)).length;

          return (
            <li key={mod.slug}>
              <button
                type="button"
                onClick={() => toggleModule(mod.slug)}
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-2 font-medium transition-colors',
                  mod.slug === currentModuleSlug
                    ? 'bg-accent-subtle text-accent-fg'
                    : 'text-fg-default hover:bg-canvas-subtle'
                )}
              >
                <span className="flex items-center gap-2 text-left">
                  <span className="text-base leading-none">{mod.icon}</span>
                  <span className="leading-snug">{mod.title}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 ml-2">
                  {lessons.length > 0 && (
                    <span className="text-xs text-fg-subtle">
                      {completedCount}/{lessons.length}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-fg-subtle" aria-hidden="true" />
                  )}
                </span>
              </button>

              {isOpen && lessons.length > 0 && (
                <ul className="mt-1 ml-4 space-y-0.5 border-l border-border pl-3">
                  {lessons.map((lesson) => {
                    const isCurrent = lesson.slug === currentLessonSlug;
                    const done = isCompleted(lesson.slug, category);
                    return (
                      <li key={lesson.slug}>
                        <Link
                          href={lessonHref(mod.slug, lesson.slug)}
                          aria-current={isCurrent ? 'page' : undefined}
                          className={cn(
                            'flex items-start gap-2 rounded-md px-2 py-2 transition-colors',
                            isCurrent
                              ? 'bg-accent-subtle text-accent-fg font-medium'
                              : 'text-fg-muted hover:bg-canvas-subtle hover:text-fg-default'
                          )}
                        >
                          {done ? (
                            <CheckCircle2
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-fg"
                              aria-label="Completed"
                            />
                          ) : (
                            <Circle
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-subtle"
                              aria-hidden="true"
                            />
                          )}
                          <span className="leading-snug text-xs">{lesson.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
