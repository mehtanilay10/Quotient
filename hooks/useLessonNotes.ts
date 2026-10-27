"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";
import { retryWithBackoff } from "@/lib/retry";
import { apiFetch } from "@/lib/apiFetch";

type LessonNote = {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  content: string;
  updatedAt: string;
};

async function fetchNotesFromServer(): Promise<LessonNote[] | null> {
  try {
    return await retryWithBackoff(
      async () => {
        const res = await fetch("/api/user/notes");
        if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
        const data = await res.json();
        return data.notes ?? [];
      },
      { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true }
    );
  } catch {
    return null;
  }
}

async function syncNoteToServer(note: LessonNote): Promise<void> {
  try {
    await retryWithBackoff(
      async () => {
        const res = await apiFetch("/api/user/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note),
        });
        if (!res.ok) {
          throw new Error(`Failed to sync note: ${res.status}`);
        }
      },
      { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true }
    );
  } catch (err) {
    logger.warn("useLessonNotes", "Failed to sync to server", err);
  }
}

export function useLessonNotes() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isLoggedOut = status === "unauthenticated";

  const [serverNotes, setServerNotes] = useState<LessonNote[] | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasLoadedNotesRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || hasLoadedNotesRef.current) return;
    hasLoadedNotesRef.current = true;
    let cancelled = false;
    fetchNotesFromServer().then((data) => {
      if (cancelled) return;
      if (data) {
        setServerNotes(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]); // intentionally ignore serverNotes to avoid refetch loops

  useEffect(() => {
    if (isLoggedOut) {
      setServerNotes(null);
      hasLoadedNotesRef.current = false;
    }
  }, [isLoggedOut]);

  const activeNotes = useMemo(
    () =>
      isLoggedIn && serverNotes
        ? Object.fromEntries(
            serverNotes.map((n) => [`${n.courseSlug}:${n.moduleSlug}:${n.lessonSlug}`, n])
          )
        : {},
    [isLoggedIn, serverNotes]
  );

  const getNote = useCallback(
    (courseSlug: string, moduleSlug: string, lessonSlug: string): LessonNote | undefined => {
      return activeNotes[`${courseSlug}:${moduleSlug}:${lessonSlug}`];
    },
    [activeNotes]
  );

  const saveNote = useCallback(
    (courseSlug: string, moduleSlug: string, lessonSlug: string, content: string) => {
      if (!isLoggedIn) return;
      const note: LessonNote = {
        courseSlug,
        moduleSlug,
        lessonSlug,
        content,
        updatedAt: new Date().toISOString(),
      };

      setServerNotes((prev) => {
        const next = prev
          ? [
              ...prev.filter(
                (n) =>
                  !(
                    n.courseSlug === courseSlug &&
                    n.moduleSlug === moduleSlug &&
                    n.lessonSlug === lessonSlug
                  )
              ),
              note,
            ]
          : [note];
        return next;
      });
      // Sync outside the state updater: updaters must be pure (React may run
      // them twice), so the network call happens after the state is committed.
      syncNoteToServer(note);
    },
    [isLoggedIn]
  );

  const deleteNote = useCallback(
    (courseSlug: string, moduleSlug: string, lessonSlug: string) => {
      if (!isLoggedIn) return;
      const key = `${courseSlug}:${moduleSlug}:${lessonSlug}`;
      setServerNotes((prev) => {
        const next = prev
          ? prev.filter(
              (n) =>
                !(
                  n.courseSlug === courseSlug &&
                  n.moduleSlug === moduleSlug &&
                  n.lessonSlug === lessonSlug
                )
            )
          : [];
        return next;
      });
      retryWithBackoff(
        async () => {
          const res = await apiFetch("/api/user/notes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseSlug, moduleSlug, lessonSlug }),
          });
          if (!res.ok) {
            throw new Error(`Failed to delete note: ${res.status}`);
          }
        },
        { maxRetries: 3, initialDelay: 500, maxDelay: 2000, jitter: true }
      ).catch(() => undefined);
    },
    [isLoggedIn]
  );

  return {
    getNote,
    saveNote,
    deleteNote,
    mounted,
    isLoggedIn,
    isLoggedOut,
  };
}
