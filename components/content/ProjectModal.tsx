"use client";

import { useEffect, useRef } from "react";
import { X, Clock, Wrench, Star } from "lucide-react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { formatHours } from "@/lib/utils";
import type { MiniProject } from "@/types";

interface ProjectModalProps {
  project: MiniProject;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll while open (restores the previous value on close)
  useBodyScrollLock(true);

  // Focus trap — moves focus into the dialog, keeps Tab inside it, and
  // restores focus to the trigger element when the modal closes.
  useFocusTrap(dialogRef, true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="project-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-canvas shadow-2xl dark:bg-canvas-subtle outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-canvas px-6 py-4 dark:bg-canvas-subtle">
          <div className="flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={project.difficulty} />
              <div className="flex items-center gap-1 text-xs text-fg-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatHours(project.estimatedHours)}
              </div>
            </div>
            <h2 id="project-modal-title" className="text-xl font-bold text-fg-default">
              {project.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
            aria-label="Close project details"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          <p className="text-fg-muted">{project.description}</p>

          {/* Skills + Tools */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <p className="mb-2 text-xs font-semibold text-fg-subtle uppercase tracking-wider">
                Skills you&apos;ll practice
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border bg-canvas-subtle px-2.5 py-0.5 text-xs text-fg-muted"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-fg-subtle uppercase tracking-wider">
                Tools needed
              </p>
              <div className="flex items-center gap-1.5 text-sm text-fg-muted">
                <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {project.tools.join(", ")}
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-fg-default">Steps</h3>
            <ol className="space-y-3">
              {project.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-fg text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-fg-default leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Expected output */}
          <div className="rounded-lg bg-success-subtle border border-success-muted p-4">
            <p className="text-sm font-semibold text-success-fg mb-1">Expected output</p>
            <p className="text-sm text-fg-default">{project.expectedOutput}</p>
          </div>

          {/* Bonus challenges */}
          {project.bonusChallenges && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg-default">
                <Star className="h-4 w-4 text-attention-fg" aria-hidden="true" />
                Bonus challenges
              </h3>
              <ul className="space-y-2">
                {project.bonusChallenges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                    <span className="text-attention-fg font-bold">→</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
