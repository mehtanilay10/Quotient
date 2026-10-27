import { apiFetch } from "@/lib/apiFetch";
import {
  PROGRESS_STORAGE_KEY,
  BOOKMARKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  LAST_PATH_STORAGE_KEY,
} from "@/lib/storageKeys";

const PROGRESS_KEY = PROGRESS_STORAGE_KEY;
const BOOKMARKS_KEY = BOOKMARKS_STORAGE_KEY;
const THEME_KEY = THEME_STORAGE_KEY;
const PREFERENCES_KEY = PREFERENCES_STORAGE_KEY;
const LAST_PATH_KEY = LAST_PATH_STORAGE_KEY;

type Theme = "light" | "dark" | "system";

export async function syncProgressToServer(): Promise<void> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(PROGRESS_KEY) : null;
    if (!raw) return;
    const progress = JSON.parse(raw);
    if (!progress || !Array.isArray(progress.lessons?.completedLessons)) return;

    const entries = progress.lessons.completedLessons.map(
      (entry: { lessonSlug: string; moduleSlug: string }) => ({
        category: "lessons" as const,
        lessonSlug: entry.lessonSlug,
        moduleSlug: entry.moduleSlug,
      })
    );

    if (entries.length > 0) {
      await apiFetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
    }
  } catch {
    // ignore sync errors
  }
}

export async function syncBookmarksToServer(): Promise<void> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(BOOKMARKS_KEY) : null;
    if (!raw) return;
    const bookmarks = JSON.parse(raw);
    if (!bookmarks || !Array.isArray(bookmarks.items)) return;

    const items = bookmarks.items.map(
      (item: {
        type: string;
        slug: string;
        title: string;
        courseSlug: string;
        moduleSlug: string;
      }) => ({
        type: item.type,
        slug: item.slug,
        title: item.title,
        courseSlug: item.courseSlug,
        moduleSlug: item.moduleSlug,
      })
    );

    if (items.length > 0) {
      await apiFetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    }
  } catch {
    // ignore sync errors
  }
}

export async function syncThemeToServer(): Promise<void> {
  try {
    const theme =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(THEME_KEY) as Theme | null)
        : null;
    if (!theme) return;

    await apiFetch("/api/user/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
  } catch {
    // ignore sync errors
  }
}

export async function syncUserPreferencesToServer(): Promise<void> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(PREFERENCES_KEY) : null;
    if (!raw) return;
    const preferences = JSON.parse(raw);
    if (!preferences || typeof preferences !== "object") return;

    await apiFetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
  } catch {
    // ignore sync errors
  }
}

export async function syncLastPathToServer(): Promise<void> {
  try {
    const path = typeof window !== "undefined" ? window.localStorage.getItem(LAST_PATH_KEY) : null;
    if (!path) return;

    await apiFetch("/api/last-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  } catch {
    // ignore sync errors
  }
}

export async function syncUserData(): Promise<void> {
  await Promise.all([
    syncProgressToServer(),
    syncBookmarksToServer(),
    syncThemeToServer(),
    syncUserPreferencesToServer(),
    syncLastPathToServer(),
  ]);
}
