"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/apiFetch";
import { THEME_STORAGE_KEY } from "@/lib/storageKeys";

const STORAGE_KEY = THEME_STORAGE_KEY;

type Theme = "light" | "dark" | "system";

async function fetchThemeFromServer(): Promise<Theme | null> {
  try {
    const res = await fetch("/api/user/theme");
    if (!res.ok) return null;
    const data = await res.json();
    return data.theme ?? null;
  } catch {
    return null;
  }
}

async function syncThemeToServer(theme: Theme): Promise<void> {
  try {
    await apiFetch("/api/user/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
  } catch (err) {
    logger.warn("useUserTheme", "Failed to sync to server", err);
  }
}

export function useUserTheme() {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();
  const isLoggedIn = status === "authenticated";
  const isLoggedOut = status === "unauthenticated";

  const [serverTheme, setServerTheme] = useState<Theme | null>(null);
  const [mounted, setMounted] = useState(false);
  // Set when the value below was just fetched from the server, so the sync
  // effect does not echo it straight back (write amplification -> 429s).
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !serverTheme) {
      fetchThemeFromServer().then((data) => {
        if (data) {
          skipNextSyncRef.current = true;
          setServerTheme(data);
          setTheme(data);
        }
      });
    }
  }, [isLoggedIn, serverTheme, setTheme]);

  useEffect(() => {
    if (!isLoggedIn || !serverTheme) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    syncThemeToServer(serverTheme);
  }, [isLoggedIn, serverTheme]);

  const updateTheme = useCallback(
    (theme: Theme) => {
      if (isLoggedIn) {
        // A user-initiated change must always be synced; cancel any pending
        // "skip echo" from an in-flight server fetch.
        skipNextSyncRef.current = false;
        setServerTheme(theme);
      }
      setTheme(theme);
      if (isLoggedOut) {
        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch {
          // ignore storage errors
        }
      }
    },
    [isLoggedIn, isLoggedOut, setTheme]
  );

  return {
    theme: isLoggedIn ? (serverTheme ?? "system") : "system",
    setTheme: updateTheme,
    mounted,
    isLoggedIn,
    isLoggedOut,
  };
}
