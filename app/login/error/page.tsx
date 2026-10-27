import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign-in problem',
  description: 'Something went wrong while signing in.',
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  Verification:
    'That sign-in link has expired or has already been used. Request a new one to continue.',
  EmailSignin:
    'We could not send the sign-in email. Please try again in a moment.',
  RateLimited:
    'Too many sign-in attempts. Please wait a few minutes and try again.',
  AccessDenied: 'This account is not allowed to sign in.',
  Configuration:
    'Sign-in is not configured correctly right now. Please try again later.',
};

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    (error && ERROR_MESSAGES[error]) ||
    'Something went wrong while signing you in. Please try again.';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-canvas p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle">
          <AlertCircle className="h-6 w-6 text-danger-fg" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-fg-default">
          Sign-in problem
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{message}</p>

        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-accent-fg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-emphasis"
        >
          Try signing in again
        </Link>
      </div>
    </div>
  );
}
