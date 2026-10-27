import { ExternalLink, BookOpen, PlayCircle, GraduationCap, Wrench } from "lucide-react";
import type { FurtherReadingItem, FurtherReadingType } from "@/types";

interface FurtherReadingProps {
  items: FurtherReadingItem[];
}

const TYPE_CONFIG: Record<
  FurtherReadingType,
  { label: string; Icon: React.ElementType; className: string }
> = {
  article: {
    label: "Article",
    Icon: BookOpen,
    className: "text-accent-fg bg-accent-subtle border-accent-muted",
  },
  video: {
    label: "Video",
    Icon: PlayCircle,
    className: "text-danger-fg bg-danger-subtle border-danger-muted",
  },
  course: {
    label: "Course",
    Icon: GraduationCap,
    className: "text-success-fg bg-success-subtle border-success-muted",
  },
  tool: {
    label: "Tool",
    Icon: Wrench,
    className: "text-attention-fg bg-attention-subtle border-attention-muted",
  },
};

const FALLBACK_CONFIG: { label: string; Icon: React.ElementType; className: string } = {
  label: "Resource",
  Icon: BookOpen,
  className: "text-fg-subtle bg-canvas-subtle border-border",
};

export function FurtherReading({ items }: FurtherReadingProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8" aria-label="Further reading">
      <h2 className="mb-1 text-lg font-bold text-fg-default">Further reading</h2>
      <p className="mb-5 text-sm text-fg-muted">
        Deepen your understanding with these curated external resources.
      </p>

      <ul className="space-y-3" role="list">
        {items.map((item) => {
          const config = TYPE_CONFIG[item.type as FurtherReadingType] ?? FALLBACK_CONFIG;
          const { Icon } = config;

          return (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-xl border border-border bg-canvas-subtle p-4 transition-colors hover:border-accent-fg hover:bg-canvas"
              >
                {/* Type badge */}
                <span
                  className={`mt-0.5 flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
                  aria-label={config.label}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {config.label}
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-fg-default group-hover:text-accent-fg transition-colors leading-snug">
                      {item.title}
                    </span>
                    <ExternalLink
                      className="h-3.5 w-3.5 shrink-0 mt-0.5 text-fg-subtle group-hover:text-accent-fg transition-colors"
                      aria-hidden="true"
                    />
                  </div>

                  {item.author && <p className="mt-0.5 text-xs text-fg-subtle">{item.author}</p>}

                  {item.description && (
                    <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
