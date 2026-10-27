import { Clock } from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";

interface ReadingTimeBadgeProps {
  minutes: number;
  className?: string;
  showIcon?: boolean;
}

export function ReadingTimeBadge({ minutes, className, showIcon = true }: ReadingTimeBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-fg-muted", className)}>
      {showIcon && <Clock className="h-3.5 w-3.5" aria-hidden="true" />}
      {formatMinutes(minutes)}
    </span>
  );
}
