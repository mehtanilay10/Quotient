import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  FileQuestion,
  ListChecks,
  MessagesSquare,
  Zap,
} from "lucide-react";
import { CustomCodeBlock } from "@/components/content/CustomCodeBlock";

interface HeroSectionProps {
  totalLessons: number;
  totalProblems: number;
  totalQuestions: number;
  totalCheatsheets: number;
  totalHours: number;
  totalCourses: number;
  /** Destination for the primary "Start Learning" call to action. */
  startHref?: string;
  /** Destination for the secondary "Question Answers" call to action. */
  questionsHref?: string;
}

/** A compact, honest sample of what a lesson looks like — used as hero artwork. */
const SAMPLE_PROMPT =
  "Two Sum · Given an array of integers, return indices of two numbers that add to a target.";
const SAMPLE_CODE = `// right-sized hints, not spoon-fed answers
int[] TwoSum(int[] nums, int target) {
  var seen = new Dictionary<int, int>();
  for (var i = 0; i < nums.Length; i++) {
    if (seen.TryGetValue(target - nums[i], out var j))
      return new[] { j, i };
    seen[nums[i]] = i;
  }
  return Array.Empty<int>();
}`;

export function HeroSection({
  totalLessons,
  totalProblems,
  totalQuestions,
  totalCheatsheets,
  totalHours,
  totalCourses,
  startHref = "/",
  questionsHref = "/backend/question-answers",
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-canvas">
      {/* Layered backdrop: grid + accent glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-fg-default) 1px, transparent 1px), linear-gradient(90deg, var(--color-fg-default) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent-fg/10 blur-3xl dark:bg-accent-fg/10"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-24">
        {/* Left: message */}
        <div className="max-w-2xl">
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-fg-default sm:text-5xl lg:text-6xl">
            The best developers aren&apos;t those who{" "}
            <span className="text-fg-subtle line-through decoration-danger-fg/60">know</span>{" "}
            everything.
            <br />
            They&apos;re the ones who{" "}
            <span className="relative whitespace-nowrap text-accent-fg">
              never stop learning
              <svg
                className="absolute -bottom-1 left-0 h-2 w-full text-accent-fg/40"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 6 Q 50 0 100 6" stroke="currentColor" strokeWidth="2.5" fill="none" />
              </svg>
            </span>
            .
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
            Quotient is a structured learning workspace for software engineers &mdash; worked
            solutions, practical questions, cheat sheets, and diagrams that explain the <em>why</em>
            , not just the answer.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={startHref}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent-fg px-5 py-3 font-medium text-white shadow-sm transition-all hover:bg-accent-emphasis hover:shadow-md"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Start learning
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href={questionsHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 font-medium text-fg-default transition-colors hover:bg-canvas-subtle"
            >
              Browse question answers
            </Link>
          </div>

          {/* Stat row */}
          <dl className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border pt-6">
            <div>
              <dt className="text-xs uppercase tracking-widest text-fg-subtle">Courses</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-fg-default">
                <BookOpen className="h-4 w-4 text-accent-fg" aria-hidden="true" />
                {totalCourses}
              </dd>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div>
              <dt className="text-xs uppercase tracking-widest text-fg-subtle">Lessons</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-fg-default">
                <ListChecks className="h-4 w-4 text-accent-fg" aria-hidden="true" />
                {totalLessons}
              </dd>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div>
              <dt className="text-xs uppercase tracking-widest text-fg-subtle">Problems</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-fg-default">
                <Zap className="h-4 w-4 text-attention-fg" aria-hidden="true" />
                {totalProblems}
              </dd>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div>
              <dt className="text-xs uppercase tracking-widest text-fg-subtle">Question answers</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-fg-default">
                <MessagesSquare className="h-4 w-4 text-done-fg" aria-hidden="true" />
                {totalQuestions}
              </dd>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div>
              <dt className="text-xs uppercase tracking-widest text-fg-subtle">Cheat sheets</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-fg-default">
                <FileQuestion className="h-4 w-4 text-danger-fg" aria-hidden="true" />
                {totalCheatsheets}
              </dd>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div>
              <dt className="text-xs uppercase tracking-widest text-fg-subtle">Reading time</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-fg-default">
                <Clock className="h-4 w-4 text-success-fg" aria-hidden="true" />
                {totalHours}h
              </dd>
            </div>
          </dl>
        </div>

        {/* Right: a real slice of the product, framed like an editor */}
        <div className="relative">
          <div
            className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-accent-fg/10 via-transparent to-done-fg/10 blur-xl"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-xl border border-border bg-canvas-subtle shadow-xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-canvas-inset px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-danger-fg/70" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-attention-fg/70" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-success-fg/70" aria-hidden="true" />
              <span className="ml-2 truncate text-xs font-medium text-fg-subtle">two-sum.cs</span>
            </div>
            {/* Question strip */}
            <div className="flex items-start gap-2 border-b border-border bg-attention-subtle/60 px-4 py-2.5 dark:bg-attention-subtle/30">
              <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-attention-fg">
                Prompt
              </span>
              <p className="text-xs leading-relaxed text-fg-muted">{SAMPLE_PROMPT}</p>
            </div>
            {/* Code — same highlighter + line numbers as lesson content */}
            <div className="border-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
              <CustomCodeBlock code={SAMPLE_CODE} language="csharp" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
