"use client";

import { Clock, Wrench, Star } from "lucide-react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn, formatHours } from "@/lib/utils";
import type { MiniProject } from "@/types";

interface ProjectCardProps {
  project: MiniProject;
  className?: string;
  onClick: () => void;
}

export function ProjectCard({ project, className, onClick }: ProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col rounded-xl border border-border bg-canvas p-5 text-left transition-all",
        "hover:border-accent-fg hover:shadow-md dark:bg-canvas-subtle",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <DifficultyBadge difficulty={project.difficulty} />
        <div className="flex items-center gap-1 text-xs text-fg-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatHours(project.estimatedHours)}
        </div>
      </div>

      <h3 className="mb-2 font-semibold text-fg-default group-hover:text-accent-fg transition-colors">
        {project.title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-fg-muted line-clamp-2">
        {project.description}
      </p>

      {/* Skills */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-medium text-fg-subtle">Skills you&apos;ll practice</p>
        <div className="flex flex-wrap gap-1">
          {project.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-xs text-fg-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <Wrench className="h-3 w-3" aria-hidden="true" />
        {project.tools.join(", ")}
      </div>

      {project.bonusChallenges && (
        <div className="mt-3 flex items-center gap-1 text-xs text-attention-fg">
          <Star className="h-3 w-3" aria-hidden="true" />
          {project.bonusChallenges.length} bonus challenge
          {project.bonusChallenges.length !== 1 && "s"}
        </div>
      )}
    </button>
  );
}
