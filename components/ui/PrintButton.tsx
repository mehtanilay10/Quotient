"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
      aria-label={label}
    >
      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
