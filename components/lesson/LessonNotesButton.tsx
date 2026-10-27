'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useLessonNotes } from '@/hooks/useLessonNotes';
import { registerShortcut, unregisterShortcut } from '@/hooks/useKeyboardShortcuts';
import { SignInPrompt } from '@/components/auth/SignInPrompt';
import { useNotesModal } from './NotesModalContext';

interface LessonNotesButtonProps {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  onOpen?: () => void;
}

export function LessonNotesButton({ courseSlug, moduleSlug, lessonSlug, onOpen }: LessonNotesButtonProps) {
  const { isLoggedOut } = useProgress();
  const { getNote, mounted } = useLessonNotes();
  const [showSignIn, setShowSignIn] = useState(false);
  const { openNotes } = useNotesModal();

  const note = mounted ? getNote(courseSlug, moduleSlug, lessonSlug) : undefined;
  const hasNotes = !!note?.content?.trim();

  const handleClick = useCallback(() => {
    if (isLoggedOut) {
      setShowSignIn(true);
      return;
    }
    if (onOpen) {
      onOpen();
    } else {
      openNotes();
    }
  }, [isLoggedOut, onOpen, openNotes]);

  useEffect(() => {
    registerShortcut('o', 'Open lesson notes', handleClick);
    return () => unregisterShortcut('o');
  }, [handleClick]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          hasNotes
            ? 'border-accent-fg bg-accent-subtle text-accent-fg'
            : 'border-border bg-canvas text-fg-muted hover:bg-canvas-subtle hover:text-fg-default'
        }`}
        aria-label="Open notes"
        aria-pressed={hasNotes}
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Notes
      </button>
      {showSignIn && <SignInPrompt onDismiss={() => setShowSignIn(false)} />}
    </>
  );
}
