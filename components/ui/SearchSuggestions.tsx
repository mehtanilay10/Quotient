"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useId,
} from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Clock, Trash2 } from "lucide-react";
import { getSearchResultHref } from "@/lib/content-hrefs";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import type { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

export interface SearchSuggestionsHandle {
  focus: () => void;
}

interface SearchSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  size?: "sm" | "md";
}

const TYPE_LABEL: Record<string, string> = {
  lesson: "Lesson",
  module: "Module",
  course: "Course",
  cheatsheet: "Cheatsheet",
};

/**
 * Wraps every case-insensitive occurrence of each query token in `<mark>` so
 * the matched part of a title/description is visually obvious. All regex
 * metacharacters are escaped so a query like "c#" or "(sql)" is treated
 * literally rather than as a pattern.
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

export const SearchSuggestions = forwardRef<SearchSuggestionsHandle, SearchSuggestionsProps>(
  function SearchSuggestions(
    {
      value,
      onChange,
      onSearch,
      placeholder = "Search…",
      className,
      autoFocus = false,
      size = "md",
    },
    ref
  ) {
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const { recent, addRecent, clearRecent } = useRecentSearches();
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    // Two instances of this component render at once (desktop search mode +
    // mobile menu); a hard-coded listbox id produced duplicate DOM ids and made
    // `aria-controls` ambiguous. `useId` keeps each instance's ids unique.
    const listId = useId();
    // Timer that closes the suggestion list shortly after blur, so a click on a
    // suggestion registers first. Cleared on unmount to avoid a late setState.
    const blurTimerRef = useRef<number | null>(null);

    useEffect(() => {
      return () => {
        if (blurTimerRef.current !== null) {
          window.clearTimeout(blurTimerRef.current);
          blurTimerRef.current = null;
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    // Show recent searches when the box is focused but empty. Kept separate
    // from the suggestions effect so opening the box never triggers a fetch.
    const showRecent = focused && !value.trim() && recent.length > 0;

    useEffect(() => {
      if (!value.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      let cancelled = false;
      setLoading(true);
      const url = `/api/search?q=${encodeURIComponent(value.trim())}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Search failed");
          return res.json();
        })
        .then((data) => {
          if (!cancelled) {
            const results = (data.results ?? []) as SearchResult[];
            setSuggestions(results);
            setIsOpen(results.length > 0);
            setSelectedIndex(-1);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([]);
            setIsOpen(false);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
        const items = listRef.current.querySelectorAll('[role="option"]');
        items[selectedIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [selectedIndex]);

    const navigateToResult = useCallback(
      (result: SearchResult) => {
        const href = getSearchResultHref(result);
        // Navigating to a result is still a "search", so the current query is
        // worth remembering even though it is then cleared.
        addRecent(value);
        onChange("");
        setIsOpen(false);
        setSelectedIndex(-1);
        router.push(href);
      },
      [onChange, router, addRecent, value]
    );

    // Records the query and hands it to the search page. Shared by the Enter
    // path and the "View all results" row.
    const submitQuery = useCallback(
      (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        addRecent(trimmed);
        onChange("");
        setIsOpen(false);
        setSelectedIndex(-1);
        onSearch?.(trimmed);
      },
      [addRecent, onChange, onSearch]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) {
          if (e.key === "Enter") {
            e.preventDefault();
            submitQuery(value);
          }
          return;
        }

        // The list has one extra selectable row beyond the suggestions: the
        // "View all results" action, which lives at index `suggestions.length`.
        const lastIndex = value.trim() && !loading ? suggestions.length : suggestions.length - 1;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < lastIndex ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : lastIndex));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            navigateToResult(suggestions[selectedIndex]);
          } else {
            submitQuery(value);
          }
        } else if (e.key === "Escape") {
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
        }
      },
      [isOpen, suggestions, selectedIndex, value, submitQuery, navigateToResult, loading]
    );

    const handleClear = useCallback(() => {
      onChange("");
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    }, [onChange]);

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted",
              size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
            )}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setFocused(true);
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onBlur={() => {
              setFocused(false);
              if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
              blurTimerRef.current = window.setTimeout(() => setIsOpen(false), 150);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            className={cn(
              "w-full rounded-lg border border-border bg-canvas text-fg-default placeholder:text-fg-subtle",
              "transition-colors focus:border-accent-fg focus:outline-none focus:ring-2 focus:ring-accent-fg/20",
              size === "sm" ? "py-1.5 pl-9 pr-8 text-sm" : "py-2 pl-10 pr-10 text-sm",
              "dark:bg-canvas-subtle"
            )}
            aria-label={placeholder}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted transition-colors hover:text-fg-default"
              )}
              aria-label="Clear search"
            >
              <X className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </button>
          )}
        </div>

        {isOpen && suggestions.length > 0 && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-border bg-canvas-overlay shadow-lg"
          >
            {suggestions.map((result, index) => {
              const label = TYPE_LABEL[result.type] || result.type;
              const isSelected = index === selectedIndex;
              // Prefer the pre-trimmed snippet so highlight keywords stay in
              // view; fall back to the full description.
              const secondary = result.snippet ?? result.description;

              return (
                <li
                  key={`${result.type}-${result.slug}`}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                    isSelected ? "bg-accent-subtle" : "hover:bg-canvas-subtle"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateToResult(result);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-md border border-border bg-canvas-subtle px-2 py-0.5 text-xs font-medium",
                      "text-fg-subtle"
                    )}
                  >
                    {label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-fg-default">
                      {highlightText(result.title, value)}
                    </p>
                    {secondary && (
                      <p className="truncate text-xs text-fg-muted">
                        {highlightText(secondary, value)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                </li>
              );
            })}
            {value.trim() && !loading && (
              <li
                role="option"
                aria-selected={selectedIndex === suggestions.length}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-t border-border",
                  selectedIndex === suggestions.length
                    ? "bg-accent-subtle"
                    : "hover:bg-canvas-subtle"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  submitQuery(value);
                }}
                onMouseEnter={() => setSelectedIndex(suggestions.length)}
              >
                <span className="text-xs text-fg-muted">
                  View all results for &ldquo;{value.trim()}&rdquo;
                </span>
                <ArrowRight className="h-3 w-3 text-fg-subtle" aria-hidden="true" />
              </li>
            )}
          </ul>
        )}

        {showRecent && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-canvas-overlay shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Recent searches
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearRecent}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-fg-subtle transition-colors hover:bg-canvas-subtle hover:text-fg-default"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            </div>
            <ul>
              {recent.map((term) => (
                <li key={term}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => submitQuery(term)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <span className="truncate">{term}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);
