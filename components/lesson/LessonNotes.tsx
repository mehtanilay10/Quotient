"use client";

import { useState, useEffect } from "react";
import { BookOpen, Save, Trash2 } from "lucide-react";
import { useLessonNotes } from "@/hooks/useLessonNotes";
import { SignInPrompt } from "@/components/auth/SignInPrompt";

interface LessonNotesProps {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}

export function LessonNotes({ courseSlug, moduleSlug, lessonSlug }: LessonNotesProps) {
  const { getNote, saveNote, deleteNote, isLoggedOut } = useLessonNotes();
  const [content, setContent] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const note = getNote(courseSlug, moduleSlug, lessonSlug);
    if (note) {
      setContent(note.content);
    }
  }, [courseSlug, moduleSlug, lessonSlug, getNote]);

  const handleSave = () => {
    if (isLoggedOut) {
      setShowSignIn(true);
      return;
    }
    saveNote(courseSlug, moduleSlug, lessonSlug, content);
  };

  const handleDelete = () => {
    if (isLoggedOut) {
      setShowSignIn(true);
      return;
    }
    setContent("");
    deleteNote(courseSlug, moduleSlug, lessonSlug);
  };

  if (!mounted) {
    return (
      <div className="rounded-xl border border-border bg-canvas p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-accent-fg" aria-hidden="true" />
          <h3 className="font-semibold text-fg-default">Your Notes</h3>
        </div>
        <div className="h-32 animate-pulse rounded-lg bg-canvas-inset" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-canvas p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent-fg" aria-hidden="true" />
            <h3 className="font-semibold text-fg-default">Your Notes</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-canvas-subtle hover:text-fg-default transition-colors"
              aria-label="Save notes"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save
            </button>
            {content && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-canvas-subtle hover:text-fg-default transition-colors"
                aria-label="Delete notes"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Take notes on this lesson..."
          className="w-full h-32 rounded-lg border border-border bg-canvas-inset p-3 text-sm text-fg-default placeholder:text-fg-subtle resize-none focus:border-accent-fg focus:outline-none focus:ring-2 focus:ring-accent-fg/20"
          aria-label="Lesson notes"
        />
        <p className="mt-2 text-xs text-fg-subtle">
          {isLoggedOut ? "Sign in to save notes across devices." : "Notes are saved automatically."}
        </p>
      </div>
      {showSignIn && <SignInPrompt onDismiss={() => setShowSignIn(false)} />}
    </>
  );
}
