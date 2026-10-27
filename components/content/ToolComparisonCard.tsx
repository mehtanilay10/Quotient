import { ExternalLink, Check, X, Minus } from "lucide-react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn } from "@/lib/utils";
import type { ToolEntry } from "@/types";

interface ToolComparisonCardProps {
  tool: ToolEntry;
  className?: string;
}

const pricingBadge: Record<string, { label: string; classes: string }> = {
  free: { label: "Free", classes: "bg-success-subtle text-success-fg border-success-muted" },
  freemium: {
    label: "Freemium",
    classes: "bg-attention-subtle text-attention-fg border-attention-muted",
  },
  paid: { label: "Paid", classes: "bg-danger-subtle text-danger-fg border-danger-muted" },
  "open-source": { label: "Open Source", classes: "bg-done-muted text-done-fg border-done-fg" },
};

function FeatureIcon({ supported }: { supported: boolean | "partial" | "unknown" }) {
  if (supported === true)
    return <Check className="h-3.5 w-3.5 text-success-fg" aria-label="Supported" />;
  if (supported === false)
    return <X className="h-3.5 w-3.5 text-danger-fg" aria-label="Not supported" />;
  if (supported === "partial")
    return <Minus className="h-3.5 w-3.5 text-attention-fg" aria-label="Partial support" />;
  return <Minus className="h-3.5 w-3.5 text-fg-subtle" aria-label="Unknown" />;
}

export function ToolComparisonCard({ tool, className }: ToolComparisonCardProps) {
  const pricing = pricingBadge[tool.pricing];

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-canvas p-5 dark:bg-canvas-subtle",
        tool.isPopular && "ring-2 ring-accent-fg/30",
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {tool.logoEmoji && (
            <span className="text-2xl leading-none" aria-hidden="true">
              {tool.logoEmoji}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-fg-default">{tool.name}</h3>
              {tool.isPopular && (
                <span className="rounded-full bg-accent-subtle border border-accent-muted text-accent-fg px-1.5 py-0 text-xs font-medium">
                  Popular
                </span>
              )}
              {tool.isBeginnnerPick && (
                <span className="rounded-full bg-success-subtle border border-success-muted text-success-fg px-1.5 py-0 text-xs font-medium">
                  ⭐ Novice
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0 text-xs font-medium",
                  pricing?.classes
                )}
              >
                {pricing?.label ?? tool.pricing}
              </span>
              <DifficultyBadge difficulty={tool.difficulty} />
            </div>
          </div>
        </div>
        {tool.url && (
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent-fg hover:underline shrink-0"
            aria-label={`Visit ${tool.name}`}
          >
            Visit
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      <p className="mb-4 text-sm text-fg-muted leading-relaxed">{tool.description}</p>

      {/* Best for */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          Best for
        </p>
        <ul className="space-y-1">
          {tool.bestFor.map((use, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-fg-default">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-success-fg" aria-hidden="true" />
              {use}
            </li>
          ))}
        </ul>
      </div>

      {/* Features matrix */}
      {tool.features && tool.features.length > 0 && (
        <div className="mt-auto">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Features
          </p>
          <div className="space-y-1">
            {tool.features.map((feat, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-fg-muted">{feat.name}</span>
                <div className="flex items-center gap-1">
                  <FeatureIcon supported={feat.supported} />
                  {feat.note && <span className="text-fg-subtle italic">{feat.note}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
