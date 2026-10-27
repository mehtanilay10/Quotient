import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatTone = "accent" | "success" | "attention" | "done";

const TONE_STYLES: Record<StatTone, { icon: string; ring: string }> = {
  accent: { icon: "text-accent-fg", ring: "bg-accent-muted" },
  success: { icon: "text-success-fg", ring: "bg-success-muted" },
  attention: { icon: "text-attention-fg", ring: "bg-attention-muted" },
  done: { icon: "text-done-fg", ring: "bg-done-muted" },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  /** Optional secondary line under the value, e.g. a personal best. */
  hint?: string;
  className?: string;
}

/**
 * Small metric tile used across the account area. Keeps the icon, value, and
 * label styling identical wherever a number is presented.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "accent",
  hint,
  className,
}: StatCardProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={cn("rounded-xl border border-border bg-canvas p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-fg-muted">{label}</p>
          <p className="mt-1 text-3xl font-bold text-fg-default">{value}</p>
          {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            styles.ring
          )}
        >
          <Icon className={cn("h-6 w-6", styles.icon)} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
