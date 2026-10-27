"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/apiFetch";

type ResetTarget = "progress" | "bookmarks" | "notes" | "offline";

const TARGETS: { id: ResetTarget; label: string; description: string }[] = [
  {
    id: "progress",
    label: "Reset progress",
    description: "Permanently removes every completed lesson, problem, and question answer.",
  },
  {
    id: "bookmarks",
    label: "Clear bookmarks",
    description: "Removes all saved lessons, problems, and question answers.",
  },
  {
    id: "notes",
    label: "Delete notes",
    description: "Removes every note you have written on a lesson.",
  },
  {
    id: "offline",
    label: "Clear offline queue",
    description: "Removes lessons queued for offline reading.",
  },
];

export function DangerZone() {
  const [confirming, setConfirming] = useState<ResetTarget | null>(null);
  const [busy, setBusy] = useState<ResetTarget | null>(null);
  const [done, setDone] = useState<ResetTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReset = async (target: ResetTarget) => {
    setBusy(target);
    setError(null);
    try {
      // apiFetch attaches the x-csrf-token header required by the API.
      const res = await apiFetch("/api/user/account-reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      if (!res.ok) throw new Error("Reset failed");
      setDone(target);
      setConfirming(null);
    } catch (err) {
      logger.error("DangerZone", "Failed to reset data:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      className="rounded-xl border border-danger-fg/40 bg-danger-subtle p-6"
      aria-labelledby="danger-zone-heading"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger-fg" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="danger-zone-heading" className="text-base font-semibold text-danger-fg">
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            These actions are permanent and cannot be undone.
          </p>

          {error && (
            <p className="mt-3 text-sm text-danger-fg" role="alert">
              {error}
            </p>
          )}

          <ul className="mt-4 space-y-3">
            {TARGETS.map((target) => {
              const isConfirming = confirming === target.id;
              const isBusy = busy === target.id;
              const isDone = done === target.id;
              return (
                <li
                  key={target.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg-default">{target.label}</p>
                    <p className="text-xs text-fg-muted">{target.description}</p>
                    {isDone && (
                      <p className="mt-1 text-xs font-medium text-success-fg" role="status">
                        Done.
                      </p>
                    )}
                  </div>

                  {isConfirming ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg-default"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => runReset(target.id)}
                        disabled={isBusy}
                        className="rounded-lg bg-danger-emphasis px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isBusy ? "Working…" : "Yes, delete"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDone(null);
                        setConfirming(target.id);
                      }}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-danger-fg hover:text-danger-fg"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {target.label.split(" ")[0]}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
