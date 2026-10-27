"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Trash2 } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { getSearchResultHref } from "@/lib/content-hrefs";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { SearchErrorBoundary } from "@/components/ui/SearchErrorBoundary";
import type { SearchResult } from "@/types";

const TYPE_LABEL: Record<string, string> = {
  lesson: "Lesson",
  module: "Module",
  course: "Course",
  cheatsheet: "Cheatsheet",
};

/**
 * Highlights every query token in `text`, matching the token-level (rather than
 * whole-string) behaviour of the search API. Regex metacharacters are escaped
 * so a query like "c#" or "(sql)" matches literally.
 */
function highlightText(text: string, query: string): React.ReactNode {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return text;
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="rounded bg-accent-subtle px-0.5 text-fg-default">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const { recent, addRecent, clearRecent } = useRecentSearches();

  // Remember a settled query once it has produced results, so the search box
  // can offer it again later without recording every intermediate keystroke.
  useEffect(() => {
    if (!loading && !error && debouncedQuery.trim() && results.length > 0) {
      addRecent(debouncedQuery);
    }
  }, [debouncedQuery, loading, error, results.length, addRecent]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Search request failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setResults(data.results ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Distinguish a failed request from a genuinely empty result set, so
          // users don't get a misleading "No results" message on a network error.
          setError(true);
          setResults([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const suggestion = useMemo(() => {
    if (results.length > 0 || !debouncedQuery.trim()) return null;
    const words = debouncedQuery.trim().split(/\s+/);
    if (words.length === 1) {
      return `Try searching for a broader term or check the spelling of "${debouncedQuery.trim()}".`;
    }
    return "Try searching for fewer keywords or a broader term.";
  }, [debouncedQuery, results.length]);

  return (
    <SearchErrorBoundary>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <SectionHeader
          eyebrow="Search"
          title="Find lessons, modules, and courses"
          description="Search across all courses, problems, cheat sheets, and question answers."
          titleAs="h1"
        />

        <div className="mb-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search lessons, modules, topics..."
            autoFocus
          />
        </div>

        {!query.trim() ? (
          <div className="space-y-4">
            <p className="text-sm text-fg-muted">
              Type a keyword above to search across the entire course library.
            </p>
            {recent.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Recent searches
                  </h2>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-fg-subtle transition-colors hover:bg-canvas-subtle hover:text-fg-default"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-canvas-subtle px-3 py-1 text-sm text-fg-muted transition-colors hover:border-accent-fg hover:text-accent-fg"
                    >
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <p className="text-sm text-fg-muted">Searching…</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-fg-muted">Something went wrong while searching.</p>
            <p className="text-sm text-accent-fg">Please check your connection and try again.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-fg-muted">No results found.</p>
            {suggestion && <p className="text-sm text-accent-fg">{suggestion}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div aria-live="polite" className="sr-only">
              {results.length} search result{results.length === 1 ? "" : "s"} found
            </div>
            {results.map((result) => {
              const href = getSearchResultHref(result);

              return (
                <Link
                  key={`${result.type}-${result.slug}`}
                  href={href}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-canvas p-4 transition-all hover:border-accent-fg hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-accent-fg">
                        {TYPE_LABEL[result.type] ?? result.type}
                      </span>
                      <p className="font-medium text-fg-default group-hover:text-accent-fg transition-colors">
                        {highlightText(result.title, debouncedQuery)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-fg-muted line-clamp-1">
                      {highlightText(result.snippet ?? result.description, debouncedQuery)}
                    </p>
                    {result.tags && result.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {result.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-xs text-fg-subtle"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-fg-subtle">
                    <span className="capitalize">{TYPE_LABEL[result.type] || result.type}</span>
                    {result.difficulty && (
                      <span className="rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-xs text-fg-subtle capitalize">
                        {result.difficulty}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </SearchErrorBoundary>
  );
}
