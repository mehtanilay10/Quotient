import { Info, Lightbulb, AlertTriangle, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalloutVariant } from "@/types";

const variantConfig: Record<
  CalloutVariant,
  { icon: React.ElementType; classes: string; iconClass: string; label: string }
> = {
  info: {
    icon: Info,
    classes: "bg-accent-subtle border-accent-muted text-fg-default",
    iconClass: "text-accent-fg",
    label: "Info",
  },
  tip: {
    icon: Lightbulb,
    classes: "bg-success-subtle border-success-muted text-fg-default",
    iconClass: "text-success-fg",
    label: "Tip",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-attention-subtle border-attention-muted text-fg-default",
    iconClass: "text-attention-fg",
    label: "Warning",
  },
  danger: {
    icon: AlertTriangle,
    classes: "bg-danger-subtle border-danger-muted text-fg-default",
    iconClass: "text-danger-fg",
    label: "Danger",
  },
  error: {
    icon: AlertTriangle,
    classes: "bg-danger-subtle border-danger-muted text-fg-default",
    iconClass: "text-danger-fg",
    label: "Error",
  },
  note: {
    icon: FileText,
    classes: "bg-canvas-subtle border-border text-fg-default",
    iconClass: "text-fg-muted",
    label: "Note",
  },
  important: {
    icon: AlertCircle,
    classes: "bg-danger-subtle border-danger-muted text-fg-default",
    iconClass: "text-danger-fg",
    label: "Important",
  },
};

interface CalloutBoxProps {
  variant?: CalloutVariant;
  title?: string;
  text: React.ReactNode;
  className?: string;
}

export function CalloutBox({ variant = "info", title, text, className }: CalloutBoxProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="note"
      className={cn("my-4 flex gap-3 rounded-lg border p-4", config.classes, className)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconClass)} aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
