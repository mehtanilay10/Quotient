import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for security policies and request handling.
 * Runs before routes are matched and can modify the request/response.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers that need to be set per-request
  // Note: Most security headers are set in next.config.ts, but middleware
  // allows for dynamic header values based on request context

  // Remove x-powered-by header to reduce information disclosure
  response.headers.delete("x-powered-by");

  // Add nonce-based CSP for inline scripts if needed in the future
  // Currently using inline scripts with 'unsafe-inline' in next.config.ts

  return response;
}

/**
 * Configure which paths the middleware should run on.
 * Matches all paths except static files, API routes that don't need middleware,
 * and Next.js internal paths.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
