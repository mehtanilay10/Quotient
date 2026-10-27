"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { usePreferencesContext } from "@/components/user/PreferencesProvider";

const ShikiHighlighter = dynamic(() => import("react-shiki").then((m) => m.ShikiHighlighter), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse rounded-lg bg-canvas-subtle" />,
});

interface CustomCodeBlockProps {
  code: string;
  language?: string;
  /** Hide the file/language header bar (used when the block is already framed). */
  hideHeader?: boolean;
}

/**
 * The app's single code block: syntax highlighting via `react-shiki`, line
 * numbers, a copy button, and collapse behaviour for long snippets.
 *
 * Shared by lesson content (`ContentBlockRenderer`) and static marketing
 * surfaces such as the home hero so code always renders identically.
 */
export function CustomCodeBlock({ code, language, hideHeader = false }: CustomCodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const { preferences, mounted } = usePreferencesContext();
  const [copied, setCopied] = useState(false);
  // When the user turns off "auto-expand code blocks", long snippets start
  // collapsed. Short ones are always shown to avoid pointless extra clicks.
  const isLong = code.split("\n").length > 12;
  const [expanded, setExpanded] = useState(false);
  const collapsed = mounted && !preferences.autoExpandCode && isLong && !expanded;
  // "Copied!" auto-resets after a moment; clear the timer on unmount so it can't
  // fire a state update on a component that is already gone.
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const shikiTheme = resolvedTheme === "dark" ? "github-dark" : "github-light";

  return (
    <div className={hideHeader ? "" : "overflow-hidden rounded-xl border border-border shadow-sm"}>
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-border bg-canvas-subtle px-4 py-2">
          <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">
            {language || "code"}
          </span>
          <div className="flex items-center gap-1">
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded-md px-2 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-canvas hover:text-fg-default"
                aria-expanded={!collapsed}
              >
                {collapsed ? "Show code" : "Hide code"}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md px-2 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-canvas hover:text-fg-default"
              aria-label={copied ? "Copied" : "Copy code"}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
      {collapsed ? (
        <div className="bg-canvas-subtle px-4 py-3 text-xs text-fg-muted">
          Code hidden — {code.split("\n").length} lines. Use “Show code” to view it.
        </div>
      ) : (
        <div className="overflow-x-auto bg-canvas text-sm">
          <ShikiHighlighter
            language={language || "text"}
            theme={shikiTheme}
            showLineNumbers
            startingLineNumber={1}
            addDefaultStyles={false}
            className="rs-code-block"
          >
            {code}
          </ShikiHighlighter>
        </div>
      )}
    </div>
  );
}
