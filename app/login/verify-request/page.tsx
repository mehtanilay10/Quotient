import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { MAGIC_LINK_EXPIRY_MINUTES } from '@/lib/magicLink';

export const metadata: Metadata = {
  title: 'Check your email',
  description: 'Your one-time Quotient sign-in link is on its way.',
  robots: { index: false, follow: false },
};

export default async function VerifyRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-canvas p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
          <Mail className="h-6 w-6 text-accent-fg" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-fg-default">Check your email</h1>
        <p className="mt-2 text-sm text-fg-muted">
          We sent a one-time sign-in link
          {email ? (
            <>
              {' '}
              to <strong className="font-medium text-fg-default">{email}</strong>
            </>
          ) : (
            ' to your inbox'
          )}
          .
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          The link expires in {MAGIC_LINK_EXPIRY_MINUTES} minutes and can only be
          used once.
        </p>
        <p className="mt-4 text-xs text-fg-subtle">
          It may take a minute to arrive. Check your spam folder if you do not
          see it.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-default transition-colors hover:bg-canvas-subtle"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
