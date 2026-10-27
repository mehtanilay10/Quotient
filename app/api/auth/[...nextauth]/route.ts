import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/auth";
import { checkMagicLinkRateLimit } from "@/lib/magicLinkRateLimit";

export const GET = handlers.GET;

/**
 * Auth.js handles every POST under `/api/auth/*`. Magic-link sign-in is the one
 * endpoint we wrap: it triggers an email send, so it gets a per-IP and
 * per-email throttle before Auth.js creates a token and calls Resend.
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (request.nextUrl.pathname.endsWith("/signin/email")) {
    const email = await readEmailFromBody(request);
    const limit = await checkMagicLinkRateLimit(request, email);

    if (!limit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((limit.retryAfterMs ?? 0) / 1000));

      // `signIn(..., { redirect: false })` on the client always parses the
      // response as JSON and expects a `url`, so return one that carries a
      // generic error code rather than a bare error payload.
      const errorUrl = new URL("/login/error", request.nextUrl.origin);
      errorUrl.searchParams.set("error", "RateLimited");

      const response = NextResponse.json(
        { url: errorUrl.toString(), reason: limit.reason },
        { status: 429 }
      );
      response.headers.set("Retry-After", String(retryAfterSeconds));
      return response;
    }
  }

  return handlers.POST(request);
}

/** Reads the email from an auth sign-in request without consuming the body. */
async function readEmailFromBody(request: NextRequest): Promise<string> {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.clone().json()) as { email?: unknown };
      return typeof body.email === "string" ? body.email : "";
    }

    const form = await request.clone().formData();
    const email = form.get("email");
    return typeof email === "string" ? email : "";
  } catch {
    return "";
  }
}
