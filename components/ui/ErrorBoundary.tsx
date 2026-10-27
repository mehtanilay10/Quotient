"use client";

import { Component, ReactNode } from "react";
import { classifyError } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function severityForStatus(statusCode: number): "low" | "medium" | "high" | "critical" {
  if (statusCode >= 500) return "critical";
  if (statusCode >= 400) return "high";
  if (statusCode >= 300) return "medium";
  return "low";
}

function suggestedActions(error: Error): string[] {
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
  if (message.includes("validation") || message.includes("invalid")) {
    actions.push("Review the form or input values and resubmit.");
  }
  if (
    message.includes("database") ||
    message.includes("prisma") ||
    message.includes("connection")
  ) {
    actions.push("This is likely temporary. Retry in a moment.");
  }
  if (actions.length === 0) {
    actions.push("Reload the page or try again later.");
  }
  return actions;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    logger.error("ErrorBoundary", "ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const appError = classifyError(this.state.error ?? new Error("Unknown error"));
      const severity = severityForStatus(appError.statusCode);
      const actions = suggestedActions(this.state.error ?? new Error("Unknown error"));

      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-border bg-canvas p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-fg-default">Something went wrong</h2>
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
              {this.props.onRetry && (
                <button
                  onClick={this.props.onRetry}
                  className="rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-default hover:bg-canvas-subtle"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => {
                  const subject = encodeURIComponent(
                    this.state.error?.message || "Application error"
                  );
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
