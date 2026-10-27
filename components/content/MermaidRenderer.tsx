"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MermaidModal } from "./MermaidModal";

interface MermaidRendererProps {
  definition: string;
  caption?: string;
  className?: string;
}

// Track which mermaid theme was last initialized so we only re-initialize on theme switches.
let mermaidCurrentTheme: string | null = null;

/**
 * Hardcoded light-mode hex values that appear in lesson diagram style directives.
 * Mapped to their dark-mode equivalents (GitHub dark color tokens).
 * This lets diagram colors adapt to the active theme without modifying every content file.
 */
const DARK_COLOR_MAP: Record<string, string> = {
  // Blue
  "#ddf4ff": "#0d2d45",
  "#e6f4ff": "#0f2a40",
  "#e8f4f8": "#112d3a",
  "#0969da": "#58a6ff",
  "#0366d6": "#58a6ff",
  "#0550ae": "#79c0ff",
  // Green
  "#d1f3d8": "#0d2e1a",
  "#e6ffed": "#0f2d1a",
  "#e8f8e8": "#0f2c18",
  "#1a7f37": "#3fb950",
  // Yellow / Amber
  "#fff8c5": "#272000",
  "#fff8e1": "#2a1f00",
  "#fff3bf": "#2a1b00",
  "#fffbeb": "#2e2200",
  "#9a6700": "#e3b341",
  "#d97706": "#e3b341",
  // Orange
  "#ffe1cc": "#2d1500",
  "#ff6b35": "#7a3419",
  "#ea580c": "#7c2d12",
  "#bc4c00": "#db6d28",
  "#e55a26": "#ff8e63",
  "#d05a0c": "#f0883e",
  // Purple
  "#eddff8": "#1e0a3c",
  "#8250df": "#bc8cff",
  "#6639ba": "#a371f7",
  "#7c3aed": "#3d1a78",
  "#6d28d9": "#a371f7",
  "#a626a4": "#db61d2",
  // Red / Pink
  "#ffebe9": "#2d0b0b",
  "#fff1f0": "#2d0f0f",
  "#fbeff2": "#2d1020",
  "#ffd8d3": "#2d0b0b",
  "#cf222e": "#f85149",
  // Gray
  "#f0f0f0": "#1f242b",
  "#f6f8fa": "#161b22",
  "#57606a": "#8b949e",
  // Shorthand
  "#fff": "#e6edf3",
};

function getDiagramType(definition: string): string {
  const firstLine = definition.split("\n")[0]?.trim() || "";
  if (firstLine.startsWith("flowchart") || firstLine.startsWith("graph")) return "flowchart";
  if (firstLine.startsWith("sequenceDiagram")) return "sequence";
  if (firstLine.startsWith("classDiagram")) return "class";
  if (firstLine.startsWith("stateDiagram")) return "state";
  if (firstLine.startsWith("erDiagram")) return "er";
  if (firstLine.startsWith("gantt")) return "gantt";
  if (firstLine.startsWith("pie")) return "pie";
  if (firstLine.startsWith("mindmap")) return "mindmap";
  if (firstLine.startsWith("timeline")) return "timeline";
  if (firstLine.startsWith("gitGraph")) return "gitgraph";
  if (firstLine.startsWith("journey")) return "journey";
  if (firstLine.startsWith("sankey")) return "sankey";
  if (firstLine.startsWith("xyChart")) return "xychart";
  if (firstLine.startsWith("block")) return "block";
  if (firstLine.startsWith("packet")) return "packet";
  if (firstLine.startsWith("radar")) return "radar";
  if (firstLine.startsWith("requirement")) return "requirement";
  return "default";
}

const DIAGRAM_BG: Record<string, { light: string; dark: string }> = {
  flowchart: { light: "#f0f9ff", dark: "#0d2d45" },
  sequence: { light: "#f0fdf4", dark: "#0d2e1a" },
  class: { light: "#faf5ff", dark: "#1e0a3c" },
  state: { light: "#fff7ed", dark: "#2d1500" },
  er: { light: "#f0fdfa", dark: "#0f2d1a" },
  gantt: { light: "#fffbeb", dark: "#2a1f00" },
  pie: { light: "#fdf2f8", dark: "#2d0b0b" },
  mindmap: { light: "#f5f3ff", dark: "#1e0a3c" },
  timeline: { light: "#fefce8", dark: "#272000" },
  gitgraph: { light: "#f6f8fa", dark: "#161b22" },
  journey: { light: "#fff1f2", dark: "#2d0f0f" },
  sankey: { light: "#eff6ff", dark: "#0f2a40" },
  xychart: { light: "#f8fafc", dark: "#1f242b" },
  block: { light: "#f8fafc", dark: "#161b22" },
  packet: { light: "#f0fdfa", dark: "#0f2d1a" },
  radar: { light: "#faf5ff", dark: "#1e0a3c" },
  requirement: { light: "#fff7ed", dark: "#2a1f00" },
  default: { light: "#f6f8fa", dark: "#161b22" },
};

function getDiagramBackground(definition: string, theme: "light" | "dark"): string {
  const type = getDiagramType(definition);
  const colors = DIAGRAM_BG[type] || DIAGRAM_BG.default;
  return theme === "dark" ? colors.dark : colors.light;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function adaptForDark(definition: string): string {
  let result = definition;
  const entries = Object.entries(DARK_COLOR_MAP).sort(([a], [b]) => b.length - a.length);

  for (const [light, dark] of entries) {
    // Avoid partial substitutions (e.g., #fff inside #fff8c5).
    const pattern = new RegExp(`${escapeRegExp(light)}(?![0-9a-f])`, "gi");
    result = result.replace(pattern, dark);
  }
  return result;
}

export function MermaidRenderer({ definition, caption, className }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "rendered" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Wait until next-themes has resolved the theme to avoid a wrong-theme render flash.
    if (!resolvedTheme) return;

    let cancelled = false;
    setStatus("loading");
    setSvgHtml("");

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        const mermaidTheme = resolvedTheme === "dark" ? "dark" : "default";

        // Re-initialize whenever the active theme changes.
        if (mermaidCurrentTheme !== mermaidTheme) {
          mermaid.initialize({
            startOnLoad: false,
            theme: mermaidTheme,
            // `strict` sanitizes diagram content and disables raw HTML/click
            // handlers, preventing XSS from lesson-authored mermaid blocks.
            securityLevel: "strict",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 16,
          });
          mermaidCurrentTheme = mermaidTheme;
        }

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const resolvedDefinition = mermaidTheme === "dark" ? adaptForDark(definition) : definition;
        const { svg } = await mermaid.render(id, resolvedDefinition);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setSvgHtml(svg);
          setStatus("rendered");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [definition, resolvedTheme]);

  const handleClose = useCallback(() => setIsModalOpen(false), []);

  const diagramBg = resolvedTheme
    ? getDiagramBackground(definition, resolvedTheme === "dark" ? "dark" : "light")
    : undefined;

  if (status === "error") {
    return (
      <div
        className={cn("my-8 rounded-lg border border-danger-muted bg-danger-subtle p-6", className)}
      >
        <p className="text-sm font-medium text-danger-fg">Diagram rendering failed</p>
        <pre className="mt-1 text-xs text-fg-muted overflow-x-auto">{error}</pre>
      </div>
    );
  }

  return (
    <>
      <figure className={cn("my-8", className)}>
        <div
          className={cn(
            "relative rounded-xl border border-border overflow-auto",
            status === "loading" && "min-h-[200px] animate-pulse",
            "flex items-start justify-center"
          )}
          style={diagramBg ? { backgroundColor: diagramBg } : undefined}
        >
          <div
            className="mermaid mermaid-diagram min-w-max p-4 md:p-6"
            ref={containerRef}
            aria-label={caption ?? "Diagram"}
          />

          {status === "rendered" && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-canvas text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
              aria-label="View diagram fullscreen"
              title="View fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        {caption && (
          <figcaption className="mt-2 text-center text-xs text-fg-subtle">{caption}</figcaption>
        )}
      </figure>

      {isModalOpen && <MermaidModal svgHtml={svgHtml} caption={caption} onClose={handleClose} />}
    </>
  );
}
