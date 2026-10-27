"use client";

import { Component, ReactNode } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-fg-default">Something went wrong</h2>
            <p className="mt-2 text-sm text-fg-muted">
              An unexpected error occurred. Please try refreshing the page.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
