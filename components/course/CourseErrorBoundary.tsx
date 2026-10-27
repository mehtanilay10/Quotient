"use client";

import { Component, ReactNode } from "react";
import { classifyError } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

interface CourseErrorBoundaryProps {
  children: ReactNode;
}

interface CourseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function courseActions(error: Error): string[] {
  const message = error.message.toLowerCase();
  const actions: string[] = [];

  if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
    actions.push("Check your internet connection and try again.");
  }
  if (
    message.includes("unauthorized") ||
    message.includes("authentication") ||
    message.includes("jwt")
  ) {
    actions.push("Try signing out and signing in again.");
  }
  if (
    message.includes("database") ||
    message.includes("prisma") ||
    message.includes("connection")
  ) {
    actions.push("This is likely temporary. Retry in a moment.");
  }
  if (actions.length === 0) {
    actions.push("Try refreshing the page or returning to the course list.");
  }
  return actions;
}

export class CourseErrorBoundary extends Component<
  CourseErrorBoundaryProps,
  CourseErrorBoundaryState
> {
  constructor(props: CourseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CourseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    logger.error("CourseErrorBoundary", "CourseErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const appError = classifyError(this.state.error ?? new Error("Unknown error"));
      const actions = courseActions(this.state.error ?? new Error("Unknown error"));

      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-border bg-canvas p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-fg-default">Course unavailable</h2>
            <p className="mt-2 text-sm text-fg-muted">{appError.message}</p>
            <div className="mt-3 text-left">
              <p className="text-xs font-medium text-fg-subtle uppercase tracking-wider">
                Suggested actions
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-fg-muted">
                {actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-default hover:bg-canvas-subtle"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = "/";
                }}
                className="rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-default hover:bg-canvas-subtle"
              >
                Back to courses
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(this.state.error?.message || "Course error");
                  window.open(`mailto:support@example.com?subject=${subject}`, "_blank");
                }}
                className="rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-default hover:bg-canvas-subtle"
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
