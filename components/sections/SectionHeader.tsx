import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleAs: Tag = "h2",
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-8", align === "center" && "text-center", className)}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-fg">
          {eyebrow}
        </p>
      )}
      <Tag
        className={cn(
          "font-bold tracking-tight text-fg-default",
          Tag === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
        )}
      >
        {title}
      </Tag>
      {description && (
        <p
          className={cn(
            "mt-3 text-base text-fg-muted leading-relaxed",
            align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
