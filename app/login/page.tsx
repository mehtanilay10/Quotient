import type { Metadata } from 'next';
import { BarChart3, Bookmark, CheckCircle2 } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { MAGIC_LINK_EXPIRY_MINUTES } from '@/lib/magicLink';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to sync your progress and bookmarks across devices.',
  robots: { index: false, follow: false },
};

function safeCallbackUrl(value: string | undefined): string {
  if (!value) return '/';
  // Only allow same-origin relative paths. Auth.js also guards the redirect,
  // but keeping the value predictable avoids odd post-login destinations.
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-canvas p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
              <BarChart3 className="h-6 w-6 text-accent-fg" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-fg-default">
              Welcome to Quotient
            </h1>
            <p className="mt-2 text-sm text-fg-muted">
              Sign in to sync your progress and bookmarks across devices.
            </p>
          </div>

          <LoginForm
            callbackUrl={safeCallbackUrl(callbackUrl)}
            expiryMinutes={MAGIC_LINK_EXPIRY_MINUTES}
          />

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <CheckCircle2 className="h-4 w-4 text-success-fg" aria-hidden="true" />
              <span>Track progress across all courses</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <Bookmark className="h-4 w-4 text-accent-fg" aria-hidden="true" />
              <span>Save bookmarks across devices</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <BarChart3 className="h-4 w-4 text-accent-fg" aria-hidden="true" />
              <span>View your progress dashboard</span>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-fg-subtle">
            By signing in, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
