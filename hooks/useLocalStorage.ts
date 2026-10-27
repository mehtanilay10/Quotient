"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

/**
 * A typesafe localStorage hook with SSR safety.
 * Returns [value, setValue, removeValue].
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // We initialize with initialValue to avoid hydration mismatch.
    // The actual localStorage value is loaded after mount via useEffect.
    return initialValue;
  });

  // After mount, sync from localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (err) {
      logger.warn("useLocalStorage", `Failed to read key "${key}"`, err);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(next));
          return next;
        });
      } catch (err) {
        logger.warn("useLocalStorage", `Failed to write key "${key}"`, err);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      logger.warn("useLocalStorage", `Failed to remove key "${key}"`, err);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
