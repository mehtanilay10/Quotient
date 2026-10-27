"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Play } from "lucide-react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/apiFetch";
import { LAST_PATH_STORAGE_KEY, PROMPT_SHOWN_STORAGE_KEY } from "@/lib/storageKeys";

const STORAGE_KEY = LAST_PATH_STORAGE_KEY;
const PROMPT_SHOWN_KEY = PROMPT_SHOWN_STORAGE_KEY;

export function ContinuePrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const isLoggedIn = status === "authenticated";

  useEffect(() => {
    if (!pathname) return;

    const checkAndShowPrompt = async () => {
      let stored: string | null = null;

      if (isLoggedIn) {
        try {
          const res = await fetch("/api/last-path");
          if (res.ok) {
            const data = await res.json();
            stored = data.path;
          }
        } catch {
          // ignore
        }
      } else {
        stored = localStorage.getItem(STORAGE_KEY);
      }

      if (stored && stored !== pathname && stored !== "/" && !pathname.startsWith(stored)) {
        const promptShown = sessionStorage.getItem(PROMPT_SHOWN_KEY);
        if (!promptShown) {
          setLastPath(stored);
          setShowPrompt(true);
          sessionStorage.setItem(PROMPT_SHOWN_KEY, "true");
        }
      }

      if (pathname !== "/") {
        if (isLoggedIn) {
          try {
            await apiFetch("/api/last-path", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: pathname }),
            });
          } catch {
            // ignore
          }
        } else {
          localStorage.setItem(STORAGE_KEY, pathname);
        }
      }
    };

    checkAndShowPrompt();
  }, [pathname, isLoggedIn]);

  if (!showPrompt || !lastPath) return null;

  return (
    <div className="fixed z-50 bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm rounded-lg border border-border bg-canvas shadow-lg p-4 animate-slide-up">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-fg-default">Pick up where you left off?</h3>
            <p className="text-sm text-fg-muted mt-1">
              You were previously viewing a lesson. Would you like to continue?
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-fg-muted hover:text-fg-default p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => setShowPrompt(false)}
            className="px-3 py-1.5 text-sm font-medium text-fg-muted hover:text-fg-default transition-colors rounded-md hover:bg-canvas-subtle"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              setShowPrompt(false);
              router.push(lastPath);
            }}
            className="px-3 py-1.5 text-sm font-medium bg-accent-emphasis text-fg-onEmphasis rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
