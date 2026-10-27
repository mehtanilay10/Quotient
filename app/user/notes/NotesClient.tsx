"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StickyNote, Clock, Search } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/user/StatCard";

interface LessonNote {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  content: string;
  updatedAt: string;
  /** Resolved by `GET /api/user/notes` — avoids importing content data client-side. */
  title: string;
  href: string;
}

export function NotesClient() {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/notes");
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch (err) {
        logger.error("NotesClient", "Failed to fetch notes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) => note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const mostRecent = useMemo(() => {
    if (notes.length === 0) return null;
    return [...notes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  }, [notes]);

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading notes">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-canvas-inset" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<StickyNote className="h-10 w-10" aria-hidden="true" />}
        title="No notes yet"
        description="Take notes while reading a lesson to capture key ideas and reminders."
        action={
          <Link
            href="/"
            className="rounded-lg bg-accent-emphasis px-4 py-2 text-sm font-medium text-accent-fg"
          >
            Start learning
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Notes" value={notes.length} icon={StickyNote} tone="accent" />
        <StatCard
          label="Matching Search"
          value={query ? filtered.length : notes.length}
          icon={Search}
          tone="done"
        />
        <StatCard
          label="Last Updated"
          value={mostRecent ? formatRelativeTime(mostRecent.updatedAt) : "—"}
          icon={Clock}
          tone="success"
          hint={mostRecent?.title}
        />
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your notes…"
          aria-label="Search notes"
          className="w-full rounded-lg border border-border bg-canvas py-2 pl-9 pr-3 text-sm text-fg-default placeholder:text-fg-subtle transition-colors hover:border-fg-muted focus:border-accent-fg focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10" aria-hidden="true" />}
          title="No matching notes"
          description={`No notes match “${query}”. Try a different search term.`}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((note, idx) => (
            <li
              key={`${note.courseSlug}-${note.moduleSlug}-${note.lessonSlug}-${idx}`}
              className="rounded-xl border border-border bg-canvas p-4 transition-colors hover:border-accent-fg"
            >
              <Link href={note.href} className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-fg-default">{note.title}</p>
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {formatRelativeTime(note.updatedAt)}
                  </span>
                </div>
                <p className="text-sm text-fg-muted line-clamp-3 whitespace-pre-line">
                  {note.content}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
