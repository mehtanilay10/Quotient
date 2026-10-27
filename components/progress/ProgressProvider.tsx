'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { CourseProgress, LessonProgress, ProgressCategory, ProgressState } from '@/types';
import { logger } from '@/lib/logger';
import { syncProgressToServer, syncUserData } from '@/lib/userSync';
import { retryWithBackoff } from '@/lib/retry';
import { apiFetch } from '@/lib/apiFetch';

const DEFAULT_PROGRESS: ProgressState = {
  lessons: { completedLessons: [], lastVisitedLesson: undefined, startedAt: undefined },
  problems: { completedLessons: [], lastVisitedLesson: undefined, startedAt: undefined },
  questionAnswers: { completedLessons: [], lastVisitedLesson: undefined, startedAt: undefined },
};

type Category = ProgressCategory;

async function fetchProgressFromServer(): Promise<ProgressState | null> {
  try {
    return await retryWithBackoff(async () => {
      const res = await apiFetch('/api/progress');
      if (!res.ok) throw new Error(`Failed to fetch progress: ${res.status}`);
      const data = await res.json();
      const progress: ProgressState = {
        lessons: { completedLessons: [], lastVisitedLesson: undefined, startedAt: undefined },
        problems: { completedLessons: [], lastVisitedLesson: undefined, startedAt: undefined },
        questionAnswers: { completedLessons: [], lastVisitedLesson: undefined, startedAt: undefined },
      };
      if (data.progress) {
        for (const [cat, items] of Object.entries(data.progress)) {
          const category = cat as Category;
          if (Array.isArray(items)) {
            progress[category] = {
              completedLessons: items.map((item: { lessonSlug: string; moduleSlug: string; completedAt: string }) => ({
                lessonSlug: item.lessonSlug,
                moduleSlug: item.moduleSlug,
                completedAt: item.completedAt,
              })),
              lastVisitedLesson: undefined,
              startedAt: items[0]?.completedAt,
            };
          }
        }
      }
      return progress;
    }, { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true });
  } catch {
    return null;
  }
}

function mergeProgress(base: ProgressState, incoming: ProgressState): ProgressState {
  const merged = { ...base };
  for (const category of Object.keys(merged) as Category[]) {
    const baseEntries = merged[category].completedLessons;
    const incomingEntries = incoming[category].completedLessons;
    const seen = new Set(baseEntries.map((e) => `${e.moduleSlug}:${e.lessonSlug}`));
    const mergedEntries = [...baseEntries];
    for (const entry of incomingEntries) {
      const key = `${entry.moduleSlug}:${entry.lessonSlug}`;
      if (!seen.has(key)) {
        mergedEntries.push(entry);
        seen.add(key);
      }
    }
    merged[category] = {
      completedLessons: mergedEntries,
      lastVisitedLesson: incoming[category].lastVisitedLesson ?? base[category].lastVisitedLesson,
      startedAt: incoming[category].startedAt ?? base[category].startedAt,
    };
  }
  return merged;
}

async function syncProgressToServerFn(progress: ProgressState): Promise<void> {
  try {
    const allEntries: Array<{ category: Category; lessonSlug: string; moduleSlug: string }> = [];
    for (const [cat, courseProgress] of Object.entries(progress)) {
      const category = cat as Category;
      for (const entry of courseProgress.completedLessons) {
        allEntries.push({ category, lessonSlug: entry.lessonSlug, moduleSlug: entry.moduleSlug });
      }
    }
    await retryWithBackoff(async () => {
      const res = await apiFetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: allEntries }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to sync progress: ${res.status} ${text}`);
      }
    }, { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true });
  } catch (err) {
    logger.warn('useProgress', 'Failed to sync to server', err);
  }
}

interface ProgressContextValue {
  progress: ProgressState;
  setProgress: (updater: ProgressState | ((prev: ProgressState) => ProgressState)) => void;
  resetProgress: () => void;
  isCompleted: (lessonSlug: string, category?: Category) => boolean;
  markComplete: (lessonSlug: string, moduleSlug: string, category?: Category) => void;
  markIncomplete: (lessonSlug: string, category?: Category) => void;
  toggleComplete: (lessonSlug: string, moduleSlug: string, category?: Category) => void;
  trackVisit: (lessonSlug: string, category?: Category) => void;
  getModuleProgress: (moduleLessonSlugs: string[], category?: Category) => { completed: number; total: number; percent: number };
  getCategory: (category: Category) => CourseProgress;
  setCategory: (category: Category, value: CourseProgress | ((prev: CourseProgress) => CourseProgress)) => void;
  stats: {
    lessons: { totalCompleted: number; lastVisited?: string; startedAt?: string };
    problems: { totalCompleted: number; lastVisited?: string; startedAt?: string };
    questionAnswers: { totalCompleted: number; lastVisited?: string; startedAt?: string };
    totalCompleted: number;
  };
  mounted: boolean;
  isLoggedIn: boolean;
  isLoggedOut: boolean;
}

const ProgressContext = React.createContext<ProgressContextValue | null>(null);

export function useProgress(): ProgressContextValue {
  const context = React.useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const isLoggedOut = status === 'unauthenticated';

  const [serverProgress, setServerProgress] = useState<ProgressState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncedToServer, setSyncedToServer] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [prevLoggedIn, setPrevLoggedIn] = useState(false);
  // Start at `false` (not `isLoggedIn`) so that when the session resolves to
  // authenticated — including on remounts where it is already authenticated —
  // the login transition always fires and local data is synced to the server.
  const serverProgressRef = useRef(serverProgress);
  serverProgressRef.current = serverProgress;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !prevLoggedIn) {
      syncUserData();
    }
    setPrevLoggedIn(isLoggedIn);
  }, [isLoggedIn, prevLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setIsInitialLoad(true);
    setSyncedToServer(false);
    let cancelled = false;
    fetchProgressFromServer().then((data) => {
      if (cancelled) return;
      if (data) {
        setServerProgress((prev) => (prev ? mergeProgress(prev, data) : data));
      }
      setIsInitialLoad(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !serverProgressRef.current) return;
    syncProgressToServerFn(serverProgressRef.current);
  }, [isLoggedIn, serverProgress, isInitialLoad]);

  useEffect(() => {
    if (isLoggedOut) {
      setServerProgress(null);
      setSyncedToServer(false);
      setIsInitialLoad(true);
    }
  }, [isLoggedOut]);

  const activeProgress = isLoggedIn && serverProgress ? serverProgress : DEFAULT_PROGRESS;

  const setActiveProgress = useCallback(
    (updater: ProgressState | ((prev: ProgressState) => ProgressState)) => {
      if (!isLoggedIn) return;
      setServerProgress((prev) => {
        const current = prev ?? DEFAULT_PROGRESS;
        if (typeof updater === 'function') {
          return (updater as (prev: ProgressState) => ProgressState)(current);
        }
        return updater;
      });
    },
    [isLoggedIn]
  );

  const getCategory = useCallback(
    (category: Category) => {
      return activeProgress[category] ?? DEFAULT_PROGRESS[category];
    },
    [activeProgress]
  );

  const setCategory = useCallback(
    (category: Category, value: CourseProgress | ((prev: CourseProgress) => CourseProgress)) => {
      if (!isLoggedIn) return;
      setActiveProgress((prev) => {
        const current = prev[category] ?? DEFAULT_PROGRESS[category];
        const next = typeof value === 'function' ? (value as (p: CourseProgress) => CourseProgress)(current) : value;
        return { ...prev, [category]: next };
      });
    },
    [setActiveProgress, isLoggedIn]
  );

  const isCompleted = useCallback(
    (lessonSlug: string, category: Category = 'lessons'): boolean => {
      const cat = getCategory(category);
      return cat.completedLessons.some((l) => l.lessonSlug === lessonSlug);
    },
    [getCategory]
  );

  const markComplete = useCallback(
    (lessonSlug: string, moduleSlug: string, category: Category = 'lessons') => {
      if (!isLoggedIn) return;
      setCategory(category, (prev) => {
        if (prev.completedLessons.some((l) => l.lessonSlug === lessonSlug)) {
          return prev;
        }
        const entry: LessonProgress = { lessonSlug, moduleSlug, completedAt: new Date().toISOString() };
        return {
          ...prev,
          completedLessons: [...prev.completedLessons, entry],
          startedAt: prev.startedAt ?? new Date().toISOString(),
          lastVisitedLesson: lessonSlug,
        };
      });
    },
    [setCategory, isLoggedIn]
  );

  const markIncomplete = useCallback(
    (lessonSlug: string, category: Category = 'lessons') => {
      if (!isLoggedIn) return;
      setCategory(category, (prev) => ({
        ...prev,
        completedLessons: prev.completedLessons.filter((l) => l.lessonSlug !== lessonSlug),
      }));
    },
    [setCategory, isLoggedIn]
  );

  const toggleComplete = useCallback(
    (lessonSlug: string, moduleSlug: string, category: Category = 'lessons') => {
      if (isCompleted(lessonSlug, category)) {
        markIncomplete(lessonSlug, category);
      } else {
        markComplete(lessonSlug, moduleSlug, category);
      }
    },
    [isCompleted, markComplete, markIncomplete]
  );

  const trackVisit = useCallback(
    (lessonSlug: string, category: Category = 'lessons') => {
      if (!isLoggedIn) return;
      setCategory(category, (prev) => ({
        ...prev,
        lastVisitedLesson: lessonSlug,
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }));
    },
    [setCategory, isLoggedIn]
  );

  const getModuleProgress = useCallback(
    (moduleLessonSlugs: string[], category: Category = 'lessons') => {
      const cat = getCategory(category);
      const completed = moduleLessonSlugs.filter((slug) => cat.completedLessons.some((l) => l.lessonSlug === slug)).length;
      const total = moduleLessonSlugs.length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { completed, total, percent };
    },
    [getCategory]
  );

  const stats = useMemo(() => {
    const lessons = activeProgress.lessons ?? DEFAULT_PROGRESS.lessons;
    const problems = activeProgress.problems ?? DEFAULT_PROGRESS.problems;
    const questionAnswers = activeProgress.questionAnswers ?? DEFAULT_PROGRESS.questionAnswers;

    const lessonStats = { totalCompleted: lessons.completedLessons.length, lastVisited: lessons.lastVisitedLesson, startedAt: lessons.startedAt };
    const problemStats = { totalCompleted: problems.completedLessons.length, lastVisited: problems.lastVisitedLesson, startedAt: problems.startedAt };
    const questionStats = { totalCompleted: questionAnswers.completedLessons.length, lastVisited: questionAnswers.lastVisitedLesson, startedAt: questionAnswers.startedAt };

    return {
      lessons: lessonStats,
      problems: problemStats,
      questionAnswers: questionStats,
      totalCompleted: lessonStats.totalCompleted + problemStats.totalCompleted + questionStats.totalCompleted,
    };
  }, [activeProgress]);

  const resetProgress = useCallback(() => {
    if (!isLoggedIn) return;
    setServerProgress(DEFAULT_PROGRESS);
    // The POST endpoint is insert-only (it can never delete rows), so a reset
    // must go through the DELETE endpoint or the progress would reappear on
    // the next fetch.
    retryWithBackoff(async () => {
      const res = await apiFetch('/api/progress', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Failed to reset progress: ${res.status}`);
      }
    }, { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true }).catch((err) => {
      logger.warn('ProgressProvider', 'Failed to reset progress on server', err);
    });
  }, [isLoggedIn]);

  const value = useMemo(
    () => ({
      progress: activeProgress,
      setProgress: setActiveProgress,
      resetProgress,
      isCompleted,
      markComplete,
      markIncomplete,
      toggleComplete,
      trackVisit,
      getModuleProgress,
      getCategory,
      setCategory,
      stats,
      mounted,
      isLoggedIn,
      isLoggedOut,
    }),
    [
      activeProgress,
      setActiveProgress,
      resetProgress,
      isCompleted,
      markComplete,
      markIncomplete,
      toggleComplete,
      trackVisit,
      getModuleProgress,
      getCategory,
      setCategory,
      stats,
      mounted,
      isLoggedIn,
      isLoggedOut,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
