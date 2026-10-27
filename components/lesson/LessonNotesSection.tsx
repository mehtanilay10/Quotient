"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { LessonNotesButton } from "./LessonNotesButton";
import { NotesModal } from "./NotesModal";
import { useLessonNotes } from "@/hooks/useLessonNotes";

interface LessonNotesSectionProps {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}

export function LessonNotesSection({
  courseSlug,
  moduleSlug,
  lessonSlug,
}: LessonNotesSectionProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const { mounted } = useLessonNotes();

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
      <LessonNotesButton
        courseSlug={courseSlug}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
        onOpen={() => setIsNotesOpen(true)}
      />
      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        courseSlug={courseSlug}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
      />
    </>
  );
}
