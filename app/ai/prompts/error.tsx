"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h2 className="text-xl font-bold text-fg-default">Something went wrong!</h2>
      <p className="mt-2 text-sm text-fg-muted">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-accent-fg px-4 py-2 text-sm font-medium text-white hover:bg-accent-emphasis transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
