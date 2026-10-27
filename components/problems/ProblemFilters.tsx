"use client";

import { useMemo, useState } from "react";
import { ModuleCard } from "@/components/course/ModuleCard";
import type { Module, LessonNavItem } from "@/types";

export function ProblemFilters({
  modules,
  lessons,
  courseSlug,
  basePrefix = "problems",
}: {
  modules: Module[];
  lessons: LessonNavItem[];
  courseSlug: string;
  basePrefix?: string;
}) {
  const [difficulty, setDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModules = useMemo(() => {
    if (difficulty === "all" && !searchQuery.trim()) return modules;

    return modules.filter((mod) => {
      const moduleLessons = lessons.filter((l) => l.moduleSlug === mod.slug);
      const matchesDifficulty =
        difficulty === "all" || moduleLessons.some((l) => l.difficulty === difficulty);
      const matchesSearch =
        !searchQuery.trim() ||
        mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        moduleLessons.some(
          (l) =>
            l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.tags ?? []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      return matchesDifficulty && matchesSearch;
    });
  }, [modules, lessons, difficulty, searchQuery]);

  const difficulties = ["all", "beginner", "intermediate", "advanced"];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                difficulty === d
                  ? "bg-accent-fg text-canvas"
                  : "border border-border bg-canvas text-fg-muted hover:bg-canvas-subtle"
              }`}
            >
              {d === "all" ? "All Levels" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search problems..."
          className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-sm text-fg-default placeholder:text-fg-subtle transition-colors focus:border-accent-fg focus:outline-none focus:ring-2 focus:ring-accent-fg/20 sm:w-64"
        />
      </div>

      {filteredModules.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No modules match your filters. Try adjusting your criteria.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              courseSlug={courseSlug}
              basePrefix={basePrefix}
              lessonCount={mod.lessonSlugs?.length ?? 0}
            />
          ))}
        </div>
      )}
    </>
  );
}
