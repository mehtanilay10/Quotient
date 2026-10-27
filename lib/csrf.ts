import { NextResponse } from "next/server";

export const CSRF_COOKIE = "quotient_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function generateCsrfToken(): string {
  // Prefer the platform CSPRNG; Math.random() is only a defensive fallback.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export function getCsrfCookieFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name !== CSRF_COOKIE) continue;
    const value = part.slice(idx + 1).trim();
    return value || null;
  }
  return null;
}

export function validateCsrf(request: Request): { valid: boolean; error?: string } {
  const cookieToken = getCsrfCookieFromRequest(request);
  const header = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !header) {
    return { valid: false, error: "Missing CSRF token" };
  }

  if (cookieToken !== header) {
    return { valid: false, error: "Invalid CSRF token" };
  }

  return { valid: true };
}

export function ensureCsrfCookie(response: NextResponse, request: Request): NextResponse {
  if (!getCsrfCookieFromRequest(request)) {
    setCsrfCookie(response, generateCsrfToken());
  }
  return response;
}
