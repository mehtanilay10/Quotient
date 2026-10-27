"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { registerShortcut, unregisterShortcut } from "@/hooks/useKeyboardShortcuts";

interface MermaidModalProps {
  svgHtml: string;
  caption?: string;
  onClose: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

function getDiagramBackground(svgHtml: string, theme: "light" | "dark"): string {
  const bgMap: Record<string, { light: string; dark: string }> = {
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

  const match = svgHtml.match(/<[^>]*class="[^"]*mermaid[^"]*"[^>]*>/);
  const text = match ? match[0] : svgHtml;
  const firstLine = text.split("\n")[0]?.trim() || "";

  let type = "default";
  if (firstLine.includes("flowchart") || firstLine.includes("graph")) type = "flowchart";
  else if (firstLine.includes("sequenceDiagram")) type = "sequence";
  else if (firstLine.includes("classDiagram")) type = "class";
  else if (firstLine.includes("stateDiagram")) type = "state";
  else if (firstLine.includes("erDiagram")) type = "er";
  else if (firstLine.includes("gantt")) type = "gantt";
  else if (firstLine.includes("pie")) type = "pie";
  else if (firstLine.includes("mindmap")) type = "mindmap";
  else if (firstLine.includes("timeline")) type = "timeline";
  else if (firstLine.includes("gitGraph")) type = "gitgraph";
  else if (firstLine.includes("journey")) type = "journey";
  else if (firstLine.includes("sankey")) type = "sankey";
  else if (firstLine.includes("xyChart")) type = "xychart";
  else if (firstLine.includes("block")) type = "block";
  else if (firstLine.includes("packet")) type = "packet";
  else if (firstLine.includes("radar")) type = "radar";
  else if (firstLine.includes("requirement")) type = "requirement";

  const colors = bgMap[type] || bgMap.default;
  return theme === "dark" ? colors.dark : colors.light;
}

export function MermaidModal({ svgHtml, caption, onClose }: MermaidModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [systemDark, setSystemDark] = useState(false);

  useFocusTrap(dialogRef, true);
  useBodyScrollLock(true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const theme = systemDark ? "dark" : "light";
  const diagramBg = useMemo(() => getDiagramBackground(svgHtml, theme), [svgHtml, theme]);

  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))),
    []
  );
  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))),
    []
  );
  const resetZoom = useCallback(() => setZoom(1), []);

  useEffect(() => {
    registerShortcut("+", "Zoom in", zoomIn);
    registerShortcut("-", "Zoom out", zoomOut);
    registerShortcut("0", "Reset zoom", resetZoom);
    return () => {
      unregisterShortcut("+");
      unregisterShortcut("-");
      unregisterShortcut("0");
    };
  }, [resetZoom, zoomIn, zoomOut]);

  const btnBase =
    "flex items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      aria-modal="true"
      role="dialog"
      aria-label={caption ?? "Diagram fullscreen view"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 flex flex-col w-full h-full outline-none"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0 bg-canvas/90 dark:bg-canvas-subtle/90 backdrop-blur">
          {caption && <p className="flex-1 truncate text-sm text-fg-muted mb-0">{caption}</p>}

          <div className="ml-auto flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className={cn(btnBase, "h-8 w-8 disabled:opacity-40 disabled:cursor-not-allowed")}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className={cn(btnBase, "h-8 min-w-[3.5rem] px-1 text-xs tabular-nums")}
              aria-label="Reset zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className={cn(btnBase, "h-8 w-8 disabled:opacity-40 disabled:cursor-not-allowed")}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

            <button
              type="button"
              onClick={onClose}
              className={cn(btnBase, "h-8 w-8")}
              aria-label="Close diagram"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body — full-bleed diagram area */}
        <div
          className="flex-1 overflow-auto p-4 md:p-6 flex justify-center"
          style={{ backgroundColor: diagramBg }}
        >
          <div
            className="mermaid max-w-full"
            style={{
              transform: `scale(${zoom})`,
              transition: "transform 0.15s ease",
              transformOrigin: "top center",
            }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        </div>

        {/* Footer caption */}
        {caption && (
          <div className="border-t border-border px-4 py-2 shrink-0 bg-canvas/90 dark:bg-canvas-subtle/90 backdrop-blur">
            <p className="text-xs text-center text-fg-subtle m-0.5">{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
