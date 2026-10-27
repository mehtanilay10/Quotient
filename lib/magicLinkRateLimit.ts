import { getClientIp, rateLimitByKey } from '@/lib/rateLimit';
import { logError } from './errorHandler';

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 5;
const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_GLOBAL = 100; // Global limit across all IPs/emails

/**
 * Throttles magic-link requests per client IP and per email address.
 *
 * Uses Redis if available for distributed rate limiting across serverless instances.
 * Falls back to in-memory for local development.
 *
 * Implements three-tier rate limiting:
 * 1. Global limit: Prevents abuse across all users
 * 2. Per-IP limit: Prevents single client abuse
 * 3. Per-email limit: Prevents spam to specific inboxes
 */
export async function checkMagicLinkRateLimit(
  request: Request,
  email: string
): Promise<{ allowed: boolean; retryAfterMs?: number; reason?: string }> {
  // Check global limit first (cheapest check)
  const globalResult = await rateLimitByKey('magic-link:global', {
    limit: MAX_REQUESTS_GLOBAL,
    windowMs: WINDOW_MS,
  });

  if (!globalResult.allowed) {
    logError('magic-link-rate-limit', new Error('Global rate limit exceeded'), {
      ip: getClientIp(request),
      email: email.trim().toLowerCase(),
    });
    return { ...globalResult, reason: 'global' };
  }

  // Check per-IP limit
  const ipResult = await rateLimitByKey(`magic-link:ip:${getClientIp(request)}`, {
    limit: MAX_REQUESTS_PER_IP,
    windowMs: WINDOW_MS,
  });

  if (!ipResult.allowed) {
    logError('magic-link-rate-limit', new Error('IP rate limit exceeded'), {
      ip: getClientIp(request),
      email: email.trim().toLowerCase(),
    });
    return { ...ipResult, reason: 'ip' };
  }

  // Check per-email limit
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { allowed: true };

  const emailResult = await rateLimitByKey(`magic-link:email:${normalizedEmail}`, {
    limit: MAX_REQUESTS_PER_EMAIL,
    windowMs: WINDOW_MS,
  });

  if (!emailResult.allowed) {
    logError('magic-link-rate-limit', new Error('Email rate limit exceeded'), {
      ip: getClientIp(request),
      email: normalizedEmail,
    });
    return { ...emailResult, reason: 'email' };
  }

  return { allowed: true };
}
