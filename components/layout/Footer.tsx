"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { GitFork, MonitorPlay, User, ExternalLink } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface FooterLink {
  href: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
}

/**
 * The footer is intentionally small: the brand and what the site is for on the
 * left, and the three outbound links (source, author, video) on the right.
 */
const EXTERNAL_LINKS: FooterLink[] = [
  {
    href: "https://github.com/mehtanilay10/quotient/",
    label: "GitHub",
    hint: "Source code",
    icon: <GitFork className="h-4 w-4" aria-hidden="true" />,
  },
  {
    href: "https://mnilay.com/",
    label: "Author",
    hint: "Nilay Mehta",
    icon: <User className="h-4 w-4" aria-hidden="true" />,
  },
  {
    href: "https://www.youtube.com/c/TutorialsTeam",
    label: "YouTube",
    hint: "Video tutorials",
    icon: <MonitorPlay className="h-4 w-4" aria-hidden="true" />,
  },
];

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-border bg-canvas-subtle transition-theme">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
          {/* Part 1 — brand and what the site is for */}
          <div className="max-w-xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold text-fg-default transition-colors hover:text-accent-fg"
            >
              <Logo className="h-6 w-6" />
              <span className="text-base">Quotient</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Structured courses, worked coding problems, cheat sheets, and practical questions —
              open, free, and built for software engineers at every stage.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              Learn the fundamentals at your own pace, grow the skills that move your career
              forward, and keep every lesson, note, and bookmark in one place — no coding experience
              required to start, and no account required to read.
            </p>
          </div>

          {/* Part 2 — outbound links */}
          <nav aria-label="Project links" className="shrink-0">
            <ul className="flex flex-col gap-1">
              {EXTERNAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-canvas hover:text-accent-fg sm:justify-end"
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                    <span className="text-xs text-fg-subtle group-hover:text-fg-muted">
                      {link.hint}
                    </span>
                    <ExternalLink className="h-3 w-3 text-fg-subtle" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-fg-subtle">
          © {year ?? "2026"} Quotient. Open knowledge for everyone.
        </div>
      </div>
    </footer>
  );
}
