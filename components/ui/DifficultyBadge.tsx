import { cn, difficultyLabel, difficultyColorClass } from "@/lib/utils";
import type { Difficulty } from "@/types";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: "sm" | "md";
  className?: string;
}

export function DifficultyBadge({ difficulty, size = "sm", className }: DifficultyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 font-medium",
        size === "sm" ? "py-0.5 text-xs" : "py-1 text-sm",
        difficultyColorClass(difficulty),
        className
      )}
    >
      {difficultyLabel(difficulty)}
    </span>
  );
}
