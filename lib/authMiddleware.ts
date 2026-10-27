import { auth } from "@/auth";
import { getOrCreateUser } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { type User } from "@prisma/client";
import { AuthError, DatabaseError } from "@/lib/errorHandler";
import { logError } from "@/lib/errorHandler";
import { ensureCsrfCookie, validateCsrf } from "@/lib/csrf";
import { rateLimit } from "@/lib/rateLimit";

export async function getAuthenticatedUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    const error = new AuthError("Unauthorized");
    logError("authMiddleware", error);
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }
  return user;
}

export function createApiAuthHandler(
  handler: (databaseUser: User, request: Request) => Promise<NextResponse>,
  options: { requireCsrf?: boolean } = {}
) {
  const { requireCsrf = true } = options;
  return async (request: Request): Promise<NextResponse> => {
    // Blanket throttle that runs before auth and CSRF validation so that
    // probing credentials or tokens never bypasses rate limiting. Uses its
    // own counter (`label`) so it does not consume the handler's quota.
    const preAuthLimit = await rateLimit(request, {
      limit: 60,
      windowMs: 60_000,
      label: "api-auth",
    });
    if (!preAuthLimit.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((preAuthLimit.retryAfterMs ?? 1000) / 1000)) },
        }
      );
    }

    const user = await requireAuthenticatedUser();
    if (user instanceof NextResponse) {
      return user;
    }

    if (requireCsrf && request.method !== "GET" && request.method !== "HEAD") {
      const csrf = validateCsrf(request);
      if (!csrf.valid) {
        const response = NextResponse.json(
          { code: "VALIDATION_ERROR", message: csrf.error ?? "Missing CSRF token" },
          { status: 400 }
        );
        return ensureCsrfCookie(response, request);
      }
    }

    try {
      const databaseUser = await getOrCreateUser(user);
      if (!databaseUser) {
        const error = new AuthError("Unauthorized");
        logError("authMiddleware", error);
        return NextResponse.json(
          { code: error.code, message: error.message },
          { status: error.statusCode }
        );
      }

      const response = await handler(databaseUser, request);

      // Ensure the CSRF cookie is present on every response (including errors and GETs).
      // The client reads this non-httpOnly cookie and echoes it back via the x-csrf-token header.
      return ensureCsrfCookie(response, request);
    } catch (error) {
      const appError = new DatabaseError("Failed to load user", error);
      logError("authMiddleware", appError);
      return NextResponse.json(
        { code: appError.code, message: appError.message },
        { status: appError.statusCode }
      );
    }
  };
}
