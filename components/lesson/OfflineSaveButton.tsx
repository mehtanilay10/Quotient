'use client';

import { useCallback, useState, useEffect } from 'react';
import { Bookmark, Download, Trash2, WifiOff } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { registerShortcut, unregisterShortcut } from '@/hooks/useKeyboardShortcuts';
import { SignInPrompt } from '@/components/auth/SignInPrompt';

interface OfflineSaveButtonProps {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  title: string;
}

export function OfflineSaveButton({ courseSlug, moduleSlug, lessonSlug, title }: OfflineSaveButtonProps) {
  const { isQueued, addToQueue, removeFromQueue, isLoggedOut } = useOfflineQueue();
  const [showSignIn, setShowSignIn] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const queued = isQueued(courseSlug, moduleSlug, lessonSlug);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (isLoggedOut) {
      setShowSignIn(true);
      return;
    }
    if (queued) {
      removeFromQueue(courseSlug, moduleSlug, lessonSlug);
    } else {
      addToQueue(courseSlug, moduleSlug, lessonSlug, title);
    }
  }, [addToQueue, courseSlug, isLoggedOut, lessonSlug, moduleSlug, queued, removeFromQueue, title]);

  useEffect(() => {
    registerShortcut('s', 'Save/remove current lesson offline', handleClick);
    return () => unregisterShortcut('s');
  }, [handleClick]);

  return (
    <>
      <button
        onClick={handleClick}
        className={`no-print flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          queued
            ? 'border-accent-fg bg-accent-subtle text-accent-fg'
            : 'border-border bg-canvas text-fg-muted hover:bg-canvas-subtle hover:text-fg-default'
        }`}
        aria-label={queued ? 'Remove from offline queue' : 'Save for offline reading'}
        aria-pressed={queued}
        title={!isOnline ? 'You are currently offline' : queued ? 'Remove from offline queue' : 'Save for offline reading'}
      >
        {queued ? (
          <>
            <Bookmark className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            Saved Offline
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Save Offline
          </>
        )}
        {!isOnline && <WifiOff className="h-3 w-3" aria-hidden="true" />}
      </button>
      {showSignIn && <SignInPrompt onDismiss={() => setShowSignIn(false)} />}
    </>
  );
}
