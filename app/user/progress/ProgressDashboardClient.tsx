"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  ClipboardList,
  Flame,
  CalendarDays,
  Clock,
  Download,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/user/StatCard";

interface LessonProgress {
  lessonSlug: string;
  moduleSlug: string;
  completedAt: string;
  title: string;
  href: string;
  estimatedMinutes?: number;
}

/** Compact, server-computed course metadata (no lesson content). */
export interface ProgressCourseEntry {
  slug: string;
  title: string;
  href: string;
  lessonCount: number;
  totalMinutes: number;
}

/** Maps a module slug to the course it belongs to. */
export interface ProgressModuleCourse {
  courseSlug: string;
  courseTitle: string;
}

/**
 * Server-computed catalog used by the dashboard. Passing this in as props
 * keeps `lib/content.ts` (and therefore every lesson JSON) out of the client
 * bundle for this route.
 */
export interface ProgressCatalog {
  courses: ProgressCourseEntry[];
  moduleCourse: Record<string, ProgressModuleCourse>;
  counts: { lessons: number; problems: number; questions: number };
}

interface CategoryProgress {
  completedLessons: LessonProgress[];
  lastVisitedLesson?: string;
  startedAt?: string;
}

interface CourseProgressInfo {
  courseSlug: string;
  courseTitle: string;
  href: string;
  completedCount: number;
  totalCount: number;
  percent: number;
  estimatedMinutesRemaining: number;
}

type TabId = "overview" | "completed" | "courses";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "completed", label: "Completed", icon: ClipboardList },
  { id: "courses", label: "Course Progress", icon: Target },
];

function getProgressColor(percent: number) {
  if (percent === 0)
    return {
      bar: "bg-canvas-inset",
      text: "text-fg-muted",
      badge: "bg-canvas-inset text-fg-muted",
      label: "Not started",
    };
  if (percent < 25)
    return {
      bar: "bg-severe-emphasis",
      text: "text-severe-fg",
      badge: "bg-severe-muted text-severe-fg",
      label: "Just started",
    };
  if (percent < 50)
    return {
      bar: "bg-attention-emphasis",
      text: "text-attention-fg",
      badge: "bg-attention-muted text-attention-fg",
      label: "In progress",
    };
  if (percent < 75)
    return {
      bar: "bg-accent-emphasis",
      text: "text-accent-fg",
      badge: "bg-accent-muted text-accent-fg",
      label: "Good progress",
    };
  if (percent < 100)
    return {
      bar: "bg-done-emphasis",
      text: "text-done-fg",
      badge: "bg-done-muted text-done-fg",
      label: "Almost done",
    };
  return {
    bar: "bg-success-emphasis",
    text: "text-success-fg",
    badge: "bg-success-muted text-success-fg",
    label: "Completed",
  };
}

/** Local calendar day key (`YYYY-MM-DD`) for a timestamp. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Current streak in days. Walks backwards from today (or yesterday, so a
 * streak survives until the end of the following day) counting consecutive
 * days that have at least one completion.
 */
function computeStreak(completedAt: string[]): { current: number; longest: number } {
  if (completedAt.length === 0) return { current: 0, longest: 0 };

  const days = new Set(completedAt.map(dayKey));
  const sorted = [...days].sort();

  // Longest run of consecutive days anywhere in the history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const curr = new Date(`${sorted[i]}T00:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Current run, anchored on today or yesterday.
  const today = new Date();
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(dayKey(cursor.toISOString()))) {
    cursor = new Date(cursor.getTime() - 86_400_000);
    if (!days.has(dayKey(cursor.toISOString()))) {
      return { current: 0, longest };
    }
  }

  let current = 0;
  while (days.has(dayKey(cursor.toISOString()))) {
    current += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return { current, longest };
}

export function ProgressDashboardClient({ catalog }: { catalog: ProgressCatalog }) {
  const [progress, setProgress] = useState<Record<string, CategoryProgress>>({});
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressRes, lastPathRes] = await Promise.all([
          fetch("/api/progress"),
          fetch("/api/last-path"),
        ]);

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const mapped: Record<string, CategoryProgress> = {};
          for (const [cat, items] of Object.entries(progressData.progress || {})) {
            mapped[cat] = {
              completedLessons: (items as LessonProgress[]).map((item) => ({
                lessonSlug: item.lessonSlug,
                moduleSlug: item.moduleSlug,
                completedAt: item.completedAt,
                title: item.title,
                href: item.href,
                estimatedMinutes: item.estimatedMinutes ?? 0,
              })),
              lastVisitedLesson: undefined,
              startedAt: (items as LessonProgress[])[0]?.completedAt,
            };
          }
          setProgress(mapped);
        }

        if (lastPathRes.ok) {
          const pathData = await lastPathRes.json();
          setLastPath(pathData.path ?? null);
        }
      } catch (err) {
        logger.error("ProgressDashboardClient", "Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const allCompletions = useMemo(
    () => Object.values(progress).flatMap((cat) => cat.completedLessons.map((l) => l.completedAt)),
    [progress]
  );

  const totalCompleted = useMemo(
    () => Object.values(progress).reduce((sum, cat) => sum + cat.completedLessons.length, 0),
    [progress]
  );

  const lessonsCompleted = progress.lessons?.completedLessons.length || 0;
  const problemsCompleted = progress.problems?.completedLessons.length || 0;
  const questionsCompleted = progress.questionAnswers?.completedLessons.length || 0;

  const totalLessonsCount = catalog.counts.lessons;
  const totalProblemsCount = catalog.counts.problems;
  const totalQuestionCount = catalog.counts.questions;

  const completionRate = useMemo(() => {
    const total = totalLessonsCount + totalProblemsCount + totalQuestionCount;
    if (total === 0) return 0;
    return Math.round(((lessonsCompleted + problemsCompleted + questionsCompleted) / total) * 100);
  }, [
    lessonsCompleted,
    problemsCompleted,
    questionsCompleted,
    totalLessonsCount,
    totalProblemsCount,
    totalQuestionCount,
  ]);

  const { current: currentStreak, longest: longestStreak } = useMemo(
    () => computeStreak(allCompletions),
    [allCompletions]
  );

  const activeDays = useMemo(() => new Set(allCompletions.map(dayKey)).size, [allCompletions]);

  const minutesInvested = useMemo(
    () =>
      Object.values(progress)
        .flatMap((cat) => cat.completedLessons)
        .reduce((sum, lesson) => sum + (lesson.estimatedMinutes ?? 0), 0),
    [progress]
  );

  const courseProgressList = useMemo<CourseProgressInfo[]>(() => {
    const catalogBySlug = new Map(catalog.courses.map((course) => [course.slug, course]));
    const courseMap = new Map<
      string,
      {
        title: string;
        href: string;
        completed: Set<string>;
        total: number;
        totalMinutes: number;
        completedMinutes: number;
      }
    >();

    for (const catProgress of Object.values(progress)) {
      for (const item of catProgress.completedLessons) {
        const courseInfo = catalog.moduleCourse[item.moduleSlug];
        if (!courseInfo) continue;
        const key = `${item.moduleSlug}:${item.lessonSlug}`;
        const existing = courseMap.get(courseInfo.courseSlug);
        if (existing) {
          existing.completed.add(key);
          existing.completedMinutes += item.estimatedMinutes ?? 0;
        } else {
          courseMap.set(courseInfo.courseSlug, {
            title: courseInfo.courseTitle,
            href: catalogBySlug.get(courseInfo.courseSlug)?.href ?? "/",
            completed: new Set([key]),
            total: 0,
            totalMinutes: 0,
            completedMinutes: item.estimatedMinutes ?? 0,
          });
        }
      }
    }

    for (const course of catalog.courses) {
      const existing = courseMap.get(course.slug);
      if (existing) {
        existing.total = course.lessonCount;
        existing.totalMinutes = course.totalMinutes;
      } else {
        courseMap.set(course.slug, {
          title: course.title,
          href: course.href,
          completed: new Set(),
          total: course.lessonCount,
          totalMinutes: course.totalMinutes,
          completedMinutes: 0,
        });
      }
    }

    return Array.from(courseMap.entries())
      .map(([courseSlug, data]) => ({
        courseSlug,
        courseTitle: data.title,
        href: data.href,
        completedCount: data.completed.size,
        totalCount: data.total,
        percent: data.total > 0 ? Math.round((data.completed.size / data.total) * 100) : 0,
        estimatedMinutesRemaining: Math.max(0, data.totalMinutes - data.completedMinutes),
      }))
      .filter((c) => c.totalCount > 0)
      .sort((a, b) => b.percent - a.percent);
  }, [progress, catalog]);

  const recentCompletions = useMemo(() => {
    if (totalCompleted === 0) return [];
    return Object.values(progress)
      .flatMap((cat) =>
        cat.completedLessons.map((lesson) => ({
          ...lesson,
          category: Object.keys(progress).find((key) => progress[key] === cat),
        }))
      )
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10);
  }, [progress, totalCompleted]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [progressRes, bookmarksRes, notesRes] = await Promise.all([
        fetch("/api/progress"),
        fetch("/api/bookmarks"),
        fetch("/api/user/notes"),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        progress: progressRes.ok ? (await progressRes.json()).progress : {},
        bookmarks: bookmarksRes.ok ? (await bookmarksRes.json()).items : [],
        notes: notesRes.ok ? (await notesRes.json()).notes : [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotient-data-${dayKey(new Date().toISOString())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error("ProgressDashboardClient", "Failed to export data:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading progress">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-canvas-inset" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-canvas-inset" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-canvas p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-accent-emphasis text-accent-fg"
                  : "text-fg-muted hover:text-fg-default"
              )}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-accent-fg hover:text-fg-default disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {exporting ? "Exporting…" : "Export my data"}
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {lastPath && (
            <Link
              href={lastPath}
              className="group flex items-center justify-between gap-4 rounded-xl border border-accent-fg/40 bg-accent-subtle p-5 transition-colors hover:border-accent-fg"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-fg">
                  Continue where you left off
                </p>
                <p className="mt-1 truncate text-sm font-medium text-fg-default">{lastPath}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-accent-emphasis px-3 py-1.5 text-sm font-medium text-accent-fg">
                Resume
              </span>
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Lessons Completed"
              value={lessonsCompleted}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Problems Solved"
              value={problemsCompleted}
              icon={Target}
              tone="accent"
            />
            <StatCard
              label="Question Answers Done"
              value={questionsCompleted}
              icon={TrendingUp}
              tone="attention"
            />
            <StatCard
              label="Completion Rate"
              value={`${completionRate}%`}
              icon={Award}
              tone="accent"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Current Streak"
              value={`${currentStreak} ${currentStreak === 1 ? "day" : "days"}`}
              icon={Flame}
              tone="attention"
              hint={longestStreak > currentStreak ? `Longest: ${longestStreak} days` : undefined}
            />
            <StatCard label="Active Days" value={activeDays} icon={CalendarDays} tone="accent" />
            <StatCard
              label="Time Invested"
              value={
                minutesInvested >= 60
                  ? `${Math.round(minutesInvested / 60)}h`
                  : `${minutesInvested}m`
              }
              icon={Clock}
              tone="done"
              hint="Based on lesson estimates"
            />
          </div>

          <div className="rounded-xl border border-border bg-canvas p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-success-fg" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-fg-default">Recent Completions</h2>
            </div>
            {recentCompletions.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-10 w-10" aria-hidden="true" />}
                title="No completions yet"
                description="Mark a lesson as complete and it will show up here."
                action={
                  <Link
                    href="/"
                    className="rounded-lg bg-accent-emphasis px-4 py-2 text-sm font-medium text-accent-fg"
                  >
                    Browse courses
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {recentCompletions.map((lesson) => (
                  <li
                    key={`${lesson.category}-${lesson.lessonSlug}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-canvas-subtle px-3 py-2 transition-colors hover:border-accent-fg"
                  >
                    <Link href={lesson.href} className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg-default group-hover:text-accent-fg transition-colors">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-fg-muted capitalize">{lesson.category}</p>
                    </Link>
                    <span className="text-xs text-fg-subtle">
                      {formatRelativeTime(lesson.completedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === "completed" && (
        <div className="rounded-xl border border-border bg-canvas p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5 text-success-fg" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-fg-default">All Completed Lessons</h2>
          </div>
          {totalCompleted === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-10 w-10" aria-hidden="true" />}
              title="Nothing completed yet"
              description="Your completed lessons, problems, and question answers will be listed here."
            />
          ) : (
            <div className="space-y-6">
              {(["lessons", "problems", "questionAnswers"] as const).map((cat) => {
                const catProgress = progress[cat];
                if (!catProgress || catProgress.completedLessons.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="mb-2 text-sm font-semibold text-fg-muted capitalize">
                      {cat === "questionAnswers"
                        ? "Question answers"
                        : cat.replace(/([A-Z])/g, " $1")}
                    </h3>
                    <ul className="space-y-2">
                      {catProgress.completedLessons
                        .sort(
                          (a, b) =>
                            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                        )
                        .map((lesson) => (
                          <li
                            key={`${cat}-${lesson.lessonSlug}`}
                            className="flex items-center justify-between rounded-lg border border-border bg-canvas-subtle px-3 py-2 transition-colors hover:border-accent-fg"
                          >
                            <Link href={lesson.href} className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-fg-default">{lesson.title}</p>
                              <p className="text-xs text-fg-muted">{lesson.href}</p>
                            </Link>
                            <span className="text-xs text-fg-subtle">
                              {formatRelativeTime(lesson.completedAt)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "courses" && (
        <div className="rounded-xl border border-border bg-canvas p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-accent-fg" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-fg-default">Course Level Progress</h2>
          </div>
          {courseProgressList.length === 0 ? (
            <EmptyState
              icon={<Target className="h-10 w-10" aria-hidden="true" />}
              title="No course progress yet"
              description="Enrol in a course and complete a lesson to see per-course progress."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {courseProgressList.map((course) => {
                const colors = getProgressColor(course.percent);
                return (
                  <Link
                    key={course.courseSlug}
                    href={course.href}
                    className="group block rounded-xl border border-border bg-canvas p-5 transition-all hover:border-accent-fg hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg-default truncate group-hover:text-accent-fg transition-colors">
                          {course.courseTitle}
                        </p>
                        <p className="mt-1 text-xs text-fg-muted">
                          {course.completedCount} of {course.totalCount} lessons completed
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          colors.badge
                        )}
                      >
                        {course.percent}%
                      </span>
                    </div>

                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-canvas-inset">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          colors.bar
                        )}
                        style={{ width: `${course.percent}%` }}
                        role="progressbar"
                        aria-valuenow={course.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${course.percent}% of ${course.courseTitle} completed`}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className={cn("text-xs font-medium", colors.text)}>{colors.label}</span>
                      <span className="text-xs text-fg-subtle">
                        {course.estimatedMinutesRemaining} min left
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
