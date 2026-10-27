import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn, formatHours } from "@/lib/utils";
import type { Difficulty } from "@/types";

interface QuestionTechnologyCardProps {
  /** Module slug — identical to the URL technology segment. */
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  difficulty: Difficulty;
  estimatedHours: number;
  questionCount: number;
  className?: string;
}

export function QuestionTechnologyCard({
  slug,
  title,
  description,
  icon,
  category,
  difficulty,
  estimatedHours,
  questionCount,
  className,
}: QuestionTechnologyCardProps) {
  return (
    <Link
      href={`/${category}/question-answers/${slug}`}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-canvas p-5",
        "transition-all hover:border-accent-fg hover:shadow-md dark:bg-canvas-subtle",
        "animate-fade-in",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {icon}
        </span>
        <DifficultyBadge difficulty={difficulty} />
      </div>

      <h3 className="mb-1 font-semibold text-fg-default transition-colors group-hover:text-accent-fg">
        {title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-fg-muted line-clamp-3">
        {description}
      </p>

      <div className="mt-auto flex items-center justify-between text-xs text-fg-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {questionCount} questions
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatHours(estimatedHours)}
          </span>
        </div>
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
