"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { NotesModal } from "./NotesModal";

interface NotesModalContextValue {
  openNotes: () => void;
  isNotesOpen: boolean;
  closeNotes: () => void;
}

const NotesModalContext = createContext<NotesModalContextValue | undefined>(undefined);

interface NotesModalProviderProps {
  children: ReactNode;
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}

export function NotesModalProvider({
  children,
  courseSlug,
  moduleSlug,
  lessonSlug,
}: NotesModalProviderProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const openNotes = useCallback(() => setIsNotesOpen(true), []);
  const closeNotes = useCallback(() => setIsNotesOpen(false), []);

  return (
    <NotesModalContext.Provider value={{ openNotes, isNotesOpen, closeNotes }}>
      {children}
      <NotesModal
        isOpen={isNotesOpen}
        onClose={closeNotes}
        courseSlug={courseSlug}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
      />
    </NotesModalContext.Provider>
  );
}

export function useNotesModal() {
  const context = useContext(NotesModalContext);
  if (!context) {
    return { openNotes: () => {}, isNotesOpen: false, closeNotes: () => {} };
  }
  return context;
}
