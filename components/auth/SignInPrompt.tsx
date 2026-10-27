"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, X, LogIn } from "lucide-react";

export function SignInPrompt({ onDismiss }: { onDismiss?: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-canvas shadow-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-accent-fg" aria-hidden="true" />
            <h3 className="font-semibold text-fg-default">Sign in to save</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-fg-muted hover:text-fg-default transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          Sign in with Google, or get a one-time link by email, to sync your bookmarks and progress
          across devices.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => signIn("google")}
            className="flex-1 rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-default hover:bg-canvas-subtle transition-colors"
          >
            Sign in with Google
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-muted hover:bg-canvas-subtle hover:text-fg-default transition-colors"
          >
            Dismiss
          </button>
        </div>
        <Link
          href={loginHref}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-fg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-emphasis"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email me a sign-in link
        </Link>
      </div>
    </div>
  );
}
