"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    logger.error("error", "Application error", error);
  }, [error]);

  const errorMessage = error?.message || "Unknown error";
  const errorStack = error?.stack || "No stack trace available";
  const errorDigest = error?.digest;

  const handleCopy = async () => {
    const details = `Error: ${errorMessage}\n\nStack Trace:\n${errorStack}\n\nDigest: ${errorDigest || "N/A"}`;
    await navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold text-fg-default sm:text-3xl">Something went wrong</h1>
      <p className="mb-8 text-sm text-fg-muted sm:text-base">
        We hit an unexpected error while loading this page. You can try again or go back to the home
        page.
      </p>

      <div className="mb-6 w-full text-left">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent-fg underline underline-offset-2 transition-colors hover:text-accent-emphasis"
          aria-expanded={showDetails}
        >
          Show error details
          {showDetails ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-3">
            <div className="rounded-md border border-border bg-canvas-subtle p-3">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
                Error Message
              </p>
              <p className="text-sm text-fg-default font-mono break-words">{errorMessage}</p>
            </div>

            {errorDigest && (
              <div className="rounded-md border border-border bg-canvas-subtle p-3">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
                  Error Digest
                </p>
                <p className="text-sm text-fg-default font-mono break-words">{errorDigest}</p>
              </div>
            )}

            <div className="rounded-md border border-border bg-canvas-subtle p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                  Stack Trace
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-canvas hover:text-fg-default"
                  aria-label="Copy error details"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-canvas p-3 text-xs text-fg-default">
                <code>{errorStack}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent-fg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-emphasis"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-fg-default transition-colors hover:border-accent-fg hover:text-accent-fg"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
