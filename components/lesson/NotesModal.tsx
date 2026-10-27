"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, BookOpen } from "lucide-react";
import { useLessonNotes } from "@/hooks/useLessonNotes";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}

export function NotesModal({
  isOpen,
  onClose,
  courseSlug,
  moduleSlug,
  lessonSlug,
}: NotesModalProps) {
  const { getNote, saveNote, deleteNote, isLoggedOut, mounted } = useLessonNotes();
  const [content, setContent] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);
  useBodyScrollLock(isOpen);

  const getNoteRef = useRef(getNote);
  getNoteRef.current = getNote;

  useEffect(() => {
    if (!isOpen) return;
    const note = getNoteRef.current(courseSlug, moduleSlug, lessonSlug);
    setContent(note?.content ?? "");
    setSaveStatus("idle");
  }, [isOpen, courseSlug, moduleSlug, lessonSlug]);

  useEffect(() => {
    if (!isOpen) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (!content) {
      setSaveStatus("idle");
      return;
    }
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(() => {
      if (isLoggedOut) {
        setSaveStatus("idle");
        return;
      }
      saveNote(courseSlug, moduleSlug, lessonSlug, content);
      setSaveStatus("saved");
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [content, isOpen, courseSlug, moduleSlug, lessonSlug, saveNote, isLoggedOut]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  const handleDelete = () => {
    if (isLoggedOut) {
      setShowSignIn(true);
      return;
    }
    setContent("");
    deleteNote(courseSlug, moduleSlug, lessonSlug);
    setSaveStatus("idle");
  };

  if (!mounted || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Lesson notes"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className="relative z-10 flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-canvas shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3 rounded-t-2xl bg-canvas-subtle shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent-fg" aria-hidden="true" />
            <h3 className="font-semibold text-fg-default text-sm">Your Notes</h3>
            {saveStatus === "saved" && <span className="text-xs text-success-fg">Saved</span>}
          </div>
          <div className="flex items-center gap-1">
            {content && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:bg-canvas hover:text-fg-default"
                aria-label="Clear notes"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-md h-8 w-8 text-fg-muted transition-colors hover:bg-canvas hover:text-fg-default"
              aria-label="Close notes"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Take notes on this lesson..."
            className="w-full h-64 rounded-lg border border-border bg-canvas-inset p-4 text-sm text-fg-default placeholder:text-fg-subtle resize-none focus:border-accent-fg focus:outline-none focus:ring-2 focus:ring-accent-fg/20"
            aria-label="Lesson notes"
          />
          <p className="mt-2 text-xs text-fg-subtle">
            {isLoggedOut
              ? "Sign in to save notes across devices."
              : "Notes are saved automatically."}
          </p>
        </div>

        {showSignIn && <SignInPrompt onDismiss={() => setShowSignIn(false)} />}
      </div>
    </div>
  );
}
