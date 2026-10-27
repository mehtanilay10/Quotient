import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center",
        className
      )}
    >
      <div className="mb-4 text-fg-subtle">
        {icon ?? <SearchX className="h-10 w-10" aria-hidden="true" />}
      </div>
      <h3 className="mb-1 text-base font-semibold text-fg-default">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action}
    </div>
  );
}
