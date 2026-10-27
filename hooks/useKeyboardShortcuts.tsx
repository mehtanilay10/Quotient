'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type ShortcutHandler = () => void;

const shortcuts: Record<string, { description: string; handler: ShortcutHandler }> = {};

const OPEN_HELP_EVENT = 'quotient:open-keyboard-shortcuts';
const SEQUENCE_TIMEOUT_MS = 1200;
const ZOOM_KEYS = new Set(['+', '-', '0']);

/** Every shortcut is listed in the help dialog, even when it is contextual. */
const HELP_GROUPS: Array<{ title: string; entries: Array<[string, string]> }> = [
  {
    title: 'Navigation',
    entries: [
      ['n', 'Go to the next lesson'],
      ['p', 'Go to the previous lesson'],
      ['g h', 'Go home'],
      ['g b', 'Go to bookmarks'],
      ['g p', 'Go to progress'],
    ],
  },
  {
    title: 'Search and help',
    entries: [
      ['/', 'Open and focus search'],
      ['?', 'Toggle this help dialog'],
      ['Escape', 'Close a dialog, search, or category menu'],
    ],
  },
  {
    title: 'Lesson actions',
    entries: [
      ['c', 'Mark the current lesson complete or incomplete'],
      ['b', 'Add or remove the current lesson bookmark'],
      ['o', 'Open lesson notes'],
      ['s', 'Save or remove the current lesson offline'],
    ],
  },
  {
    title: 'Display',
    entries: [
      ['t', 'Toggle light and dark theme'],
      ['+', 'Zoom in an open image or diagram'],
      ['-', 'Zoom out an open image or diagram'],
      ['0', 'Reset image or diagram zoom'],
    ],
  },
];

export function registerShortcut(key: string, description: string, handler: ShortcutHandler) {
  shortcuts[key] = { description, handler };
}

export function unregisterShortcut(key: string) {
  delete shortcuts[key];
}

/** Opens the same help dialog from outside the shortcut dispatcher. */
export function openKeyboardShortcutsHelp() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_HELP_EVENT));
}

/** Whether the user is currently typing, so single-key shortcuts must not fire. */
function isTypingInField(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  );
}

/**
 * Global keyboard shortcut dispatcher.
 *
 * Registered shortcuts (`registerShortcut`) are matched by a single lowercase
 * key or a `g`-prefixed sequence such as `g h`. They only fire when the user is
 * not typing. `?` toggles the help dialog. Mounted once, in the root layout.
 */
export function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const sequenceRef = useRef<string | null>(null);
  const sequenceTimerRef = useRef<number | null>(null);

  const clearSequence = useCallback(() => {
    sequenceRef.current = null;
    if (sequenceTimerRef.current !== null) {
      window.clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  // The profile menu opens the same dialog through a DOM event, so there is
  // still exactly one owner of the open/close state.
  useEffect(() => {
    const openHelp = () => {
      clearSequence();
      setShowHelp(true);
    };
    window.addEventListener(OPEN_HELP_EVENT, openHelp);
    return () => window.removeEventListener(OPEN_HELP_EVENT, openHelp);
  }, [clearSequence]);

  useEffect(() => () => clearSequence(), [clearSequence]);

  // Built-in lesson navigation. The links themselves are rendered by the
  // lesson pages with `data-lesson-nav`, so this works for course, problem, and
  // question-answer routes without those pages knowing about shortcuts.
  const goToLessonNav = useCallback(
    (direction: 'prev' | 'next') => {
      const link = document.querySelector<HTMLAnchorElement>(
        `a[data-lesson-nav="${direction}"]`
      );
      if (link?.href) router.push(link.getAttribute('href') ?? link.href);
    },
    [router]
  );

  useEffect(() => {
    registerShortcut('n', 'Next lesson', () => goToLessonNav('next'));
    registerShortcut('p', 'Previous lesson', () => goToLessonNav('prev'));
    registerShortcut('t', 'Toggle light/dark theme', () =>
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    );
    registerShortcut('g h', 'Go home', () => router.push('/'));
    registerShortcut('g b', 'Go to bookmarks', () => router.push('/user/bookmarks'));
    registerShortcut('g p', 'Go to progress', () => router.push('/user/progress'));

    return () => {
      unregisterShortcut('n');
      unregisterShortcut('p');
      unregisterShortcut('t');
      unregisterShortcut('g h');
      unregisterShortcut('g b');
      unregisterShortcut('g p');
    };
  }, [goToLessonNav, resolvedTheme, router, setTheme]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingInField(document.activeElement)) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        clearSequence();
        setShowHelp((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        clearSequence();
        setShowHelp(false);
        return;
      }

      // Only the help dialog and zoom controls should respond while another
      // modal is open; otherwise a stray shortcut could navigate behind it.
      if (showHelp) return;
      const modalOpen = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (modalOpen && !ZOOM_KEYS.has(e.key)) {
        clearSequence();
        return;
      }

      const key = e.key.toLowerCase();

      if (sequenceRef.current) {
        const sequenceKey = `${sequenceRef.current} ${key}`;
        clearSequence();
        const shortcut = shortcuts[sequenceKey];
        if (shortcut) {
          e.preventDefault();
          shortcut.handler();
        }
        return;
      }

      if (key === 'g' && Object.keys(shortcuts).some((entry) => entry.startsWith('g '))) {
        sequenceRef.current = 'g';
        sequenceTimerRef.current = window.setTimeout(() => {
          sequenceRef.current = null;
          sequenceTimerRef.current = null;
        }, SEQUENCE_TIMEOUT_MS);
        return;
      }

      const shortcut = shortcuts[key];
      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    },
    [clearSequence, showHelp]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <KeyboardShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />;
}

interface HelpProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal listing the available shortcuts. Open/close state is owned by
 * `KeyboardShortcuts` so there is exactly one window keydown listener.
 */
export function KeyboardShortcutsHelp({ open, onClose }: HelpProps) {
  if (!open) return null;
  return <ShortcutsDialog onClose={onClose} />;
}

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const knownKeys = new Set(
    HELP_GROUPS.flatMap((group) => group.entries.map(([keys]) => keys))
  );
  const extraEntries = Object.entries(shortcuts)
    .filter(([key]) => !knownKeys.has(key))
    .map(([key, { description }]) => [key, description] as [string, string]);
  const groups =
    extraEntries.length > 0
      ? [...HELP_GROUPS, { title: 'Other', entries: extraEntries }]
      : HELP_GROUPS;

  useFocusTrap(dialogRef, true);
  useBodyScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-canvas-overlay shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-lg font-bold text-fg-default">Keyboard Shortcuts</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
            aria-label="Close keyboard shortcuts"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.title} aria-label={group.title}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  {group.title}
                </h4>
                <div className="space-y-1.5">
                  {group.entries.map(([keys, description]) => (
                    <div
                      key={keys}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-canvas-subtle px-3 py-2"
                    >
                      <span className="text-sm text-fg-default">{description}</span>
                      <ShortcutKeys keys={keys} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-4 text-xs text-fg-subtle">
            Single-key shortcuts are disabled while you are typing in a field.
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutKeys({ keys }: { keys: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {keys.split(' ').map((key, index) => (
        <span key={`${key}-${index}`} className="flex items-center gap-1">
          {index > 0 && (
            <span className="text-[10px] font-medium uppercase text-fg-subtle">then</span>
          )}
          <kbd className="rounded border border-border bg-canvas px-2 py-0.5 text-xs font-mono text-fg-muted">
            {key === 'Escape' ? 'Esc' : key.toUpperCase()}
          </kbd>
        </span>
      ))}
    </span>
  );
}
