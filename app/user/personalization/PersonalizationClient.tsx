"use client";

import { usePreferencesContext } from "@/components/user/PreferencesProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { Settings2, Palette, BookOpen, Accessibility, ChevronDown } from "lucide-react";

interface PersonalizationClientProps {
  /** Destinations offered for the "Default landing page" preference. */
  landingPages: LandingPageOption[];
}

type FontSize = "sm" | "md" | "lg" | "xl";
type CodeFontSize = "sm" | "md" | "lg";
type Density = "comfortable" | "compact";

export interface LandingPageOption {
  value: string;
  label: string;
}

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const CODE_FONT_SIZES: { value: CodeFontSize; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const DENSITIES: { value: Density; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas text-fg-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-fg-default">{title}</h2>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
    </div>
  );
}

function RadioCardGroup<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-accent-fg bg-accent-subtle text-accent-fg"
                : "border-border bg-canvas text-fg-muted hover:border-fg-muted hover:text-fg-default"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-canvas p-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-fg-default">{label}</p>
        {description && <p className="text-xs text-fg-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-accent-emphasis" : "bg-canvas-inset"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

export function PersonalizationClient({ landingPages }: PersonalizationClientProps) {
  // Share the single preference store owned by PreferencesProvider so changes
  // apply to `<html>` immediately instead of waiting for a reload.
  const { preferences, updatePreference, mounted } = usePreferencesContext();

  if (!mounted) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading preferences">
        <div className="h-32 animate-pulse rounded-xl bg-canvas-inset" />
        <div className="h-48 animate-pulse rounded-xl bg-canvas-inset" />
        <div className="h-64 animate-pulse rounded-xl bg-canvas-inset" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-canvas p-6">
        <SectionHeading
          icon={Palette}
          title="Appearance"
          description="Visual theme and text size"
        />
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg-default">Theme</p>
              <p className="text-xs text-fg-muted">
                Choose between dark, light, or system preference
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div>
            <p className="text-sm font-medium text-fg-default mb-2">Font size</p>
            <RadioCardGroup
              name="fontSize"
              options={FONT_SIZES}
              value={preferences.fontSize as FontSize | null}
              onChange={(value) => updatePreference("fontSize", value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-canvas p-6">
        <SectionHeading icon={BookOpen} title="Reading" description="Content display preferences" />
        <div className="space-y-3">
          <Toggle
            label="Content density"
            description="Comfortable adds more whitespace; compact fits more content"
            checked={preferences.density === "compact"}
            onChange={(value) => updatePreference("density", value ? "compact" : "comfortable")}
          />
          <Toggle
            label="Show completed lessons"
            description="Keep completed lessons visible in course and module lists"
            checked={preferences.showCompleted}
            onChange={(value) => updatePreference("showCompleted", value)}
          />
          <Toggle
            label="Auto-expand code blocks"
            description="Expand long code blocks automatically instead of starting collapsed"
            checked={preferences.autoExpandCode}
            onChange={(value) => updatePreference("autoExpandCode", value)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-canvas p-6">
        <SectionHeading
          icon={Accessibility}
          title="Accessibility"
          description="Motion and readability"
        />
        <div className="space-y-5">
          <Toggle
            label="Reduced motion"
            description="Minimize animations and transitions across the app"
            checked={preferences.reducedMotion}
            onChange={(value) => updatePreference("reducedMotion", value)}
          />
          <div>
            <p className="text-sm font-medium text-fg-default mb-2">Code font size</p>
            <RadioCardGroup
              name="codeFontSize"
              options={CODE_FONT_SIZES}
              value={preferences.codeFontSize as CodeFontSize | null}
              onChange={(value) => updatePreference("codeFontSize", value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-canvas p-6">
        <SectionHeading icon={Settings2} title="Preferences" description="Default behavior" />
        <div>
          <label htmlFor="landing-page" className="text-sm font-medium text-fg-default mb-2 block">
            Default landing page
          </label>
          <div className="relative">
            <select
              id="landing-page"
              value={landingPages.find((p) => p.value === preferences.defaultLanding)?.value ?? "/"}
              onChange={(e) => updatePreference("defaultLanding", e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-canvas px-3 py-2 pr-8 text-sm text-fg-default transition-colors hover:border-fg-muted focus:border-accent-fg focus:outline-none"
            >
              {landingPages.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
