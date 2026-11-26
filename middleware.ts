import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecrypt } from "jose";
import { hkdf } from "@panva/hkdf";

/**
 * Middleware for security policies, the optional site-wide auth gate, and
 * request handling. Runs before routes are matched and can modify the
 * request/response.
 *
 * Auth gate: when SITE_REQUIRE_AUTH=true, every page request must carry a
 * valid Auth.js session JWT or it is redirected to /login at the edge —
 * before the ISR cache is consulted — so anonymous/bot traffic stops
 * generating ISR reads. Default (unset) keeps the site fully public.
 */

const SESSION_COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

function isSitePrivate() {
  return process.env.SITE_REQUIRE_AUTH === "true";
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    // API routes enforce auth themselves and must keep returning JSON 401s.
    pathname.startsWith("/api/") ||
    // Static files: manifest.json, sw.js, robots.txt, sitemap.xml, icons, etc.
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

/**
 * Verifies the Auth.js session cookie (JWE, dir/A256CBC-HS512) exactly the
 * way @auth/core decodes it: the encryption key is HKDF-derived from
 * AUTH_SECRET with the cookie name as salt. Returns false on any failure.
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  for (const name of SESSION_COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;
    try {
      const key = await hkdf(
        "sha256",
        secret,
        name,
        `Auth.js Generated Encryption Key (${name})`,
        64
      );
      await jwtDecrypt(token, key, {
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256CBC-HS512", "A256GCM"],
        clockTolerance: 15,
      });
      return true;
    } catch {
      // Malformed/expired token under this cookie name — try the next one.
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSitePrivate() && !isPublicPath(pathname) && !(await hasValidSession(request))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  // Remove x-powered-by header to reduce information disclosure
  response.headers.delete("x-powered-by");

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
