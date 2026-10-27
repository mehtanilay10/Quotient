"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn } from "@/lib/utils";
import type { GlossaryTerm, GlossaryCategory } from "@/types";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "core-concepts", label: "Core Concepts" },
  { value: "models-and-training", label: "Models" },
  { value: "prompting", label: "Prompting" },
  { value: "tools-and-apis", label: "Tools & APIs" },
  { value: "agents-and-automation", label: "Agents" },
  { value: "architecture", label: "Architecture" },
  { value: "safety-and-ethics", label: "Safety" },
];

interface GlossarySearchProps {
  terms: GlossaryTerm[];
  className?: string;
}

export function GlossarySearch({ terms, className }: GlossarySearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return terms.filter((term) => {
      const matchesQuery =
        !q ||
        term.term.toLowerCase().includes(q) ||
        term.shortDefinition.toLowerCase().includes(q) ||
        term.alsoKnownAs?.some((aka) => aka.toLowerCase().includes(q));
      const matchesCategory = category === "all" || term.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [terms, query, category]);

  const grouped = useMemo(() => {
    const map: Record<string, GlossaryTerm[]> = {};
    for (const term of filtered) {
      const letter = term.term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(term);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className={className}>
      {/* Search & filter */}
      <div className="mb-6 space-y-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search terms, definitions…"
          autoFocus
        />
        <FilterBar
          label="Filter by category"
          options={CATEGORIES.map((c) => ({
            ...c,
            count:
              c.value === "all" ? terms.length : terms.filter((t) => t.category === c.value).length,
          }))}
          value={category}
          onChange={setCategory}
        />
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-fg-muted">
        {filtered.length} term{filtered.length !== 1 && "s"}
        {query && ` for "${query}"`}
      </p>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <EmptyState
          title="No matching terms"
          description="Try a different search — or clear the filter."
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg-default"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([letter, letterTerms]) => (
            <section key={letter} aria-label={`Terms starting with ${letter}`}>
              <h2 className="mb-3 text-sm font-bold text-fg-subtle border-b border-border pb-1">
                {letter}
              </h2>
              <div className="space-y-3">
                {letterTerms.map((term) => (
                  <div
                    key={term.id}
                    id={term.slug}
                    className="rounded-lg border border-border bg-canvas p-4 dark:bg-canvas-subtle"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-fg-default">{term.term}</h3>
                      {term.alsoKnownAs && term.alsoKnownAs.length > 0 && (
                        <span className="text-xs text-fg-subtle">
                          aka: {term.alsoKnownAs.join(", ")}
                        </span>
                      )}
                      <DifficultyBadge difficulty={term.difficulty} />
                    </div>
                    <p className="mb-2 text-sm text-fg-muted leading-relaxed">
                      {term.shortDefinition}
                    </p>
                    <p className="text-sm text-fg-default leading-relaxed">{term.fullDefinition}</p>
                    {term.examples && term.examples.length > 0 && (
                      <div className="mt-3 rounded-md bg-canvas-subtle border border-border p-3">
                        <p className="mb-1 text-xs font-semibold text-fg-subtle">Examples</p>
                        <ul className="space-y-0.5">
                          {term.examples.map((ex, i) => (
                            <li key={i} className="text-xs text-fg-muted">
                              • {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
