'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo } from 'react';
import { useUserPreferences, type UserPreferences } from '@/hooks/useUserPreferences';
import {
  applyAppearanceClasses,
  getAppearanceClasses,
  writeAppearanceCookie,
} from '@/lib/appearance';

interface PreferencesContextValue {
  preferences: UserPreferences;
  /** Updates one preference and persists it (server when logged in, localStorage otherwise). */
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  /** False until client-side preferences have loaded (avoids hydration flashes). */
  mounted: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// A layout effect applies the classes before the browser paints, so if React
// rewrites <html class> during hydration the pre-paint script result is
// restored without a visible flash. Falls back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Applies appearance preferences (font size, code font size, density, reduced
 * motion) to `<html>` for the whole app and exposes the full preference set to
 * any component that needs it (e.g. code blocks reading `autoExpandCode`).
 *
 * The root layout also injects a blocking script that applies the mirrored
 * cookie before first paint. This provider starts from the same bootstrapped
 * values, so the first effect does not reset the page to the default size
 * while the database request is in flight.
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { preferences, updatePreference, mounted } = useUserPreferences();
  const { fontSize, codeFontSize, density, reducedMotion } = preferences;

  const htmlClasses = useMemo(
    () => getAppearanceClasses({ fontSize, codeFontSize, density, reducedMotion }),
    [fontSize, codeFontSize, density, reducedMotion]
  );

  useIsomorphicLayoutEffect(() => {
    applyAppearanceClasses(htmlClasses);
  }, [htmlClasses]);

  // Keep the cookie mirror in sync for the next page load. Rewriting it after
  // logout also clears a stale signed-in appearance in favour of the local one.
  useEffect(() => {
    if (!mounted) return;
    writeAppearanceCookie({ fontSize, codeFontSize, density, reducedMotion });
  }, [mounted, fontSize, codeFontSize, density, reducedMotion]);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, updatePreference, mounted }),
    [preferences, updatePreference, mounted]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/**
 * Reads the current preferences from context. Falls back to sensible defaults
 * when no provider is present so components stay usable in isolation (tests,
 * storybook-style previews) and during SSR.
 */
export function usePreferencesContext(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  return (
    ctx ?? {
      preferences: {
        fontSize: null,
        density: null,
        codeFontSize: null,
        reducedMotion: false,
        autoExpandCode: true,
        showCompleted: true,
        defaultLanding: null,
      },
      updatePreference: () => {},
      mounted: false,
    }
  );
}
