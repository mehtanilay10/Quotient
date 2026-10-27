"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { useProgress } from "@/hooks/useProgress";
import { registerShortcut, unregisterShortcut } from "@/hooks/useKeyboardShortcuts";
import { PdfDownloadButton } from "@/components/ui/PdfDownloadButton";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import type { BookmarkItem, ProgressCategory } from "@/types";

interface LessonActionsProps {
  lesson: {
    slug: string;
    title: string;
    difficulty: string;
    estimatedMinutes: number;
    isOptional?: boolean;
    tags?: string[];
  };
  courseSlug: string;
  moduleSlug: string;
  category?: ProgressCategory;
  children?: React.ReactNode;
}

export function LessonActions({
  lesson,
  courseSlug,
  moduleSlug,
  category = "lessons",
  children,
}: LessonActionsProps) {
  const { toggleComplete, isCompleted, trackVisit, isLoggedOut } = useProgress();
  const [showSignIn, setShowSignIn] = useState(false);
  const [lastAction, setLastAction] = useState<"complete" | "incomplete" | null>(null);

  useEffect(() => {
    trackVisit(lesson.slug, category);
  }, [lesson.slug, trackVisit, category]);

  const completed = isCompleted(lesson.slug, category);

  const handleToggleComplete = useCallback(() => {
    if (isLoggedOut) {
      setShowSignIn(true);
      return;
    }
    toggleComplete(lesson.slug, moduleSlug, category);
    setLastAction(completed ? "incomplete" : "complete");
    setTimeout(() => setLastAction(null), 2000);
  }, [category, completed, isLoggedOut, lesson.slug, moduleSlug, toggleComplete]);

  useEffect(() => {
    registerShortcut("c", "Mark current lesson complete/incomplete", handleToggleComplete);
    return () => unregisterShortcut("c");
  }, [handleToggleComplete]);

  const categoryLabel = useMemo(() => {
    if (category === "questionAnswers") return "Question";
    return category.slice(0, -1);
  }, [category]);

  const bookmarkItem = useMemo<Omit<BookmarkItem, "id" | "addedAt">>(
    () => ({
      type:
        category === "questionAnswers"
          ? "questionAnswer"
          : category === "problems"
            ? "problem"
            : "lesson",
      slug: lesson.slug,
      title: lesson.title,
      courseSlug,
      moduleSlug,
    }),
    [category, courseSlug, lesson.slug, lesson.title, moduleSlug]
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-border bg-canvas-subtle px-2.5 py-1 text-xs text-fg-subtle capitalize">
        {categoryLabel}
      </span>

      <button
        onClick={handleToggleComplete}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
          completed
            ? "border-success-emphasis bg-success-subtle text-success-fg shadow-sm"
            : "border-border bg-canvas text-fg-muted hover:border-success-emphasis hover:text-success-fg"
        }`}
        aria-pressed={completed}
      >
        <CheckCircle2
          className={`h-3.5 w-3.5 ${completed ? "fill-current" : ""}`}
          aria-hidden="true"
        />
        {completed ? "Completed" : "Mark Complete"}
      </button>

      <BookmarkButton item={bookmarkItem} enableShortcut />

      <PdfDownloadButton
        targetId={
          category === "questionAnswers"
            ? "question-content"
            : category === "problems"
              ? "problem-content"
              : "lesson-content"
        }
        filename={`${lesson.slug}.pdf`}
        label="Download PDF"
      />

      {children}

      {showSignIn && <SignInPrompt onDismiss={() => setShowSignIn(false)} />}
    </div>
  );
}
