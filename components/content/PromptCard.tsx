"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import type { PromptTemplate } from "@/types";

interface PromptCardProps {
  prompt: PromptTemplate;
  className?: string;
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [showExample, setShowExample] = useState(false);
  // Clear the "Copied!" reset timer on unmount to avoid a late setState.
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.template);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const categoryColorMap: Record<string, string> = {
    writing: "bg-accent-subtle text-accent-fg",
    thinking: "bg-done-muted text-done-fg",
    research: "bg-attention-subtle text-attention-fg",
    coding: "bg-success-subtle text-success-fg",
    creativity: "bg-done-muted text-done-fg",
    productivity: "bg-accent-subtle text-accent-fg",
    learning: "bg-success-subtle text-success-fg",
    analysis: "bg-attention-subtle text-attention-fg",
    summarization: "bg-canvas-inset text-fg-muted",
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-canvas overflow-hidden dark:bg-canvas-subtle",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                categoryColorMap[prompt.category] ?? "bg-canvas-subtle text-fg-muted"
              )}
            >
              {prompt.category}
            </span>
            <DifficultyBadge difficulty={prompt.difficulty} />
            {prompt.isStarter && (
              <span className="rounded-full bg-attention-subtle border border-attention-muted text-attention-fg px-2 py-0.5 text-xs font-medium">
                ⭐ Starter
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy prompt template"
            className="flex items-center gap-1.5 rounded-md border border-border bg-canvas-subtle px-2 py-1 text-xs text-fg-muted transition-colors hover:border-accent-fg hover:text-accent-fg"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-success-fg" aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                Copy
              </>
            )}
          </button>
        </div>
        <h3 className="font-semibold text-fg-default">{prompt.title}</h3>
        <p className="mt-0.5 text-sm text-fg-muted">{prompt.description}</p>
      </div>

      {/* Template */}
      <div className="p-4 flex-1">
        <pre className="whitespace-pre-wrap rounded-lg border border-border bg-canvas-subtle p-3 text-xs leading-relaxed text-fg-default font-mono overflow-x-auto">
          {prompt.template}
        </pre>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-xs text-fg-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tips & example toggle */}
      {(prompt.tips || prompt.example) && (
        <div className="border-t border-border p-4 space-y-3">
          {prompt.tips && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-fg-subtle uppercase tracking-wider">
                Tips
              </p>
              <ul className="space-y-1">
                {prompt.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-fg-muted">
                    <span className="text-accent-fg mt-0.5 shrink-0">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {prompt.example && (
            <button
              type="button"
              onClick={() => setShowExample((v) => !v)}
              className="text-xs text-accent-fg hover:underline"
            >
              {showExample ? "Hide example" : "Show filled example"}
            </button>
          )}
          {prompt.example && showExample && (
            <pre className="whitespace-pre-wrap rounded-lg border border-success-muted bg-success-subtle p-3 text-xs leading-relaxed text-fg-default font-mono overflow-x-auto animate-slide-up">
              {prompt.example}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
