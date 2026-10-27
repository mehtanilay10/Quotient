"use client";

import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/csrf";

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return readCsrfCookie();
}

/**
 * Client-side fetch wrapper that attaches the CSRF token from the
 * non-httpOnly cookie to the `x-csrf-token` header for mutating requests.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getCsrfToken();
  if (token) {
    headers.set(CSRF_HEADER, token);
  }
  return fetch(url, { ...init, headers });
}
