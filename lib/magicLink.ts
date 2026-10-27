import { logger } from '@/lib/logger';

const DEFAULT_EXPIRY_MINUTES = 15;
const MAX_EXPIRY_MINUTES = 60;

/** Sender used when `EMAIL_FROM` is not configured. Resend's onboarding
 * address only delivers to the account owner, so production deployments must
 * set a verified sender. */
export const DEFAULT_EMAIL_FROM = 'Quotient <onboarding@resend.dev>';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function parseExpiryMinutes(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_EXPIRY_MINUTES;
  return Math.min(Math.round(parsed), MAX_EXPIRY_MINUTES);
}

/**
 * Lifetime of a magic link, in minutes. Read from
 * `MAGIC_LINK_EXPIRY_MINUTES` so the email and the UI copy always agree.
 */
export const MAGIC_LINK_EXPIRY_MINUTES = parseExpiryMinutes(
  process.env.MAGIC_LINK_EXPIRY_MINUTES
);

/** Same lifetime in seconds, which is what Auth.js expects for `maxAge`. */
export const MAGIC_LINK_EXPIRY_SECONDS = MAGIC_LINK_EXPIRY_MINUTES * 60;

export type MagicLinkEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildMagicLinkEmail({
  url,
  expiresInMinutes = MAGIC_LINK_EXPIRY_MINUTES,
}: {
  url: string;
  expiresInMinutes?: number;
}): MagicLinkEmailContent {
  const safeUrl = escapeHtml(url);
  const subject = 'Sign in to Quotient';

  const text = [
    'Sign in to Quotient',
    '',
    `Use the one-time link below to sign in. It expires in ${expiresInMinutes} minutes and can only be used once:`,
    '',
    url,
    '',
    "If you didn't request this email, you can safely ignore it.",
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f6f8fa;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f8fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid #d0d7de;border-radius:12px;">
            <tr>
              <td style="padding:32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2328;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Sign in to Quotient</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#59636e;">
                  Click the button below to sign in. This link expires in ${expiresInMinutes} minutes and can only be used once.
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${safeUrl}" style="display:inline-block;background-color:#0969da;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">Sign in</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#59636e;">Or paste this link into your browser:</p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="${safeUrl}" style="color:#0969da;">${safeUrl}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#818b98;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

/**
 * Sends a magic link through the Resend HTTP API.
 *
 * In development, when `RESEND_API_KEY` is not set, the link is written to the
 * server log instead so the flow can be tested locally without an account.
 * Production must configure the key — otherwise this throws and Auth.js
 * reports the sign-in as failed.
 */
export async function sendMagicLinkEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}): Promise<void> {
  const { subject, html, text } = buildMagicLinkEmail({ url });
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'RESEND_API_KEY is not configured. Magic-link emails cannot be sent.'
      );
    }

    logger.info('auth', `Magic link for ${to} (dev fallback): ${url}`);
    return;
  }

  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Resend could not send the magic link (${response.status})${
        detail ? `: ${detail.slice(0, 300)}` : ''
      }`
    );
  }
}
