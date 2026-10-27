import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-fg-subtle">404</p>
      <h1 className="mb-2 text-2xl font-bold text-fg-default sm:text-3xl">Page not found</h1>
      <p className="mb-8 text-sm text-fg-muted sm:text-base">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-accent-fg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-emphasis"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>
    </div>
  );
}
