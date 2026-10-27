'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowLeft, Mail } from 'lucide-react';
import { logger } from '@/lib/logger';

type LoginFormProps = {
  callbackUrl: string;
  expiryMinutes: number;
};

export function LoginForm({ callbackUrl, expiryMinutes }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      logger.error('login', 'Google sign in error', err);
      setError('We could not start Google sign-in. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setIsEmailLoading(true);
    setError(null);

    try {
      const result = await signIn('email', {
        email: trimmedEmail,
        callbackUrl,
        redirect: false,
      });

      if (result?.status === 429) {
        setError(
          'Too many sign-in attempts. Please wait a few minutes and try again.'
        );
        return;
      }

      // Requests for unknown addresses resolve successfully too, so an error
      // here means the send/config failed — not that the account is missing.
      // That keeps the response resistant to email enumeration.
      if (result?.error) {
        logger.error('login', 'Magic link request failed', result.error);
        setError(
          'We could not send the sign-in link right now. Please try again in a moment.'
        );
        return;
      }

      setEmailSent(true);
    } catch (err) {
      logger.error('login', 'Magic link sign in error', err);
      setError(
        'We could not send the sign-in link. Check your connection and try again.'
      );
    } finally {
      setIsEmailLoading(false);
    }
  };

  const resetForm = () => {
    setEmailSent(false);
    setEmail('');
    setError(null);
  };

  if (emailSent) {
    return (
      <div
        className="mt-6 space-y-4 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
          <Mail className="h-6 w-6 text-accent-fg" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-fg-default">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-fg-muted">
            We sent a one-time sign-in link to{' '}
            <strong className="font-medium text-fg-default">{email.trim()}</strong>.
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            The link expires in {expiryMinutes} minutes and can only be used
            once.
          </p>
        </div>
        <p className="text-xs text-fg-subtle">
          It may take a minute to arrive. Check your spam folder if you do not
          see it.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-accent-fg hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isEmailLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-canvas px-4 py-2.5 text-sm font-medium text-fg-default transition-colors hover:bg-canvas-subtle disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <div>
          <label
            htmlFor="magic-link-email"
            className="mb-1.5 block text-sm font-medium text-fg-default"
          >
            Email address
          </label>
          <input
            id="magic-link-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isEmailLoading || isGoogleLoading}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-fg-default placeholder:text-fg-subtle transition-colors focus:border-accent-fg focus:outline-none focus:ring-2 focus:ring-accent-fg/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isEmailLoading || isGoogleLoading || !email.trim()}
          className="w-full rounded-lg bg-accent-fg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-emphasis disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEmailLoading ? 'Sending link...' : 'Email me a sign-in link'}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger-muted bg-danger-subtle px-3 py-2 text-sm text-danger-fg"
        >
          {error}
        </p>
      )}

      <p className="text-center text-xs text-fg-subtle">
        No password needed — the link signs you in once and then expires.
      </p>
    </div>
  );
}
