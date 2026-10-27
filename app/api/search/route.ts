import { NextResponse } from "next/server";
import { searchAll } from "@/lib/content";
import { rateLimit } from "@/lib/rateLimit";
import { logError, ValidationError } from "@/lib/errorHandler";

// searchAll lowercases and scans every title/description/tag in the content
// tree, so query length is capped to keep each request cheap.
const MAX_QUERY_LENGTH = 200;
const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

export async function GET(request: Request) {
  // Search is public but expensive, so it is rate-limited per client IP.
  const rateLimitResult = await rateLimit(request, RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.retryAfterMs ?? 1000) / 1000)),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length > MAX_QUERY_LENGTH) {
    const error = new ValidationError(
      `Search query must be at most ${MAX_QUERY_LENGTH} characters`
    );
    logError("search:GET", error);
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  const results = searchAll(query);
  return NextResponse.json({ results });
}
