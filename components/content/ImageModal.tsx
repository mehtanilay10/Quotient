"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { registerShortcut, unregisterShortcut } from "@/hooks/useKeyboardShortcuts";
import Image from "next/image";

interface ImageModalProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export function ImageModal({ src, alt, caption, onClose }: ImageModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

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
  }, []);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label={alt ?? "Image preview"}
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
        className="relative z-10 flex flex-col w-full max-w-5xl max-h-[90vh] rounded-2xl border border-border bg-canvas shadow-2xl dark:bg-canvas-subtle outline-none"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3 rounded-t-2xl bg-canvas dark:bg-canvas-subtle shrink-0">
          {caption && <p className="flex-1 truncate text-sm text-fg-muted">{caption}</p>}

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
              aria-label="Reset zoom"
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
              aria-label="Close image preview"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body — scrollable image area */}
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          <div
            className="relative origin-center"
            style={{
              transform: `scale(${zoom})`,
              transition: "transform 0.15s ease",
              maxWidth: "100%",
              minHeight: "200px",
            }}
          >
            <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" />
          </div>
        </div>

        {/* Footer caption */}
        {caption && (
          <div className="border-t border-border px-5 py-2 rounded-b-2xl bg-canvas dark:bg-canvas-subtle shrink-0">
            <p className="text-xs text-center text-fg-subtle">{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
