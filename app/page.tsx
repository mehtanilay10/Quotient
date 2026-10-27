import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Layers,
  ShieldCheck,
  Bug,
  Terminal,
  GitBranch,
  Database,
  BrainCircuit,
  CheckCircle2,
  Code2,
  GraduationCap,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionHeader } from "@/components/sections/SectionHeader";
import {
  getCourseStats,
  getAllCourses,
  getCourseCategory,
  getQuestionCategories,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import type { Course } from "@/types";

export const metadata = buildMetadata({
  title: "Quotient | Structured Learning for Software Engineers",
  description:
    "A structured learning workspace for software engineers: courses, worked solutions, practical questions, cheat sheets, and AI tooling. Build durable fundamentals and learn the why, not just the answer.",
  path: "/",
});

/** Icon per content category, so the "what's inside" band reads like a curriculum. */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  backend: <Terminal className="h-4 w-4" aria-hidden="true" />,
  frontend: <Code2 className="h-4 w-4" aria-hidden="true" />,
  database: <Database className="h-4 w-4" aria-hidden="true" />,
  devops: <GitBranch className="h-4 w-4" aria-hidden="true" />,
  ai: <BrainCircuit className="h-4 w-4" aria-hidden="true" />,
  architecture: <Layers className="h-4 w-4" aria-hidden="true" />,
  fundamentals: <Compass className="h-4 w-4" aria-hidden="true" />,
};

export default function HomePage() {
  const stats = getCourseStats();
  const courses = getAllCourses().filter((c) => !c.isQuestionAnswer);
  const firstCourse = courses[0];

  const [firstQuestionCategory] = getQuestionCategories();

  // Distinct curriculum pillars — copy is specific to real learning workflows,
  // not generic "we have courses" filler.
  const pillars = [
    {
      icon: <Code2 className="h-5 w-5 text-accent-fg" aria-hidden="true" />,
      tag: "Worked solutions",
      title: "Problems with multiple approaches",
      description:
        "Every coding problem ships with a naive solution, an optimal one, complexity analysis, and the trade-offs that decide which one belongs in production.",
    },
    {
      icon: <Terminal className="h-5 w-5 text-done-fg" aria-hidden="true" />,
      tag: "Realistic answers",
      title: "Question answers by technology and depth",
      description:
        "Conceptual, system design, and language-specific answers grouped by depth — so you always know what to study next.",
    },
    {
      icon: <Bug className="h-5 w-5 text-danger-fg" aria-hidden="true" />,
      tag: "The why",
      title: "Diagrams and decision frameworks",
      description:
        "Sequence diagrams, trade-off tables, and comparisons that make architecture and algorithms click instead of memorise.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-success-fg" aria-hidden="true" />,
      tag: "Reference",
      title: "Cheat sheets you keep open",
      description:
        "Dense, correct, copy-ready snippets for C#, SQL, React, and more — the one tab you leave pinned while you work.",
    },
  ];

  // Career-growth pillars — the long-run story: fundamentals, leveling up,
  // learning by doing, and staying current/consistent.
  const careerPillars = [
    {
      icon: <GraduationCap className="h-5 w-5 text-accent-fg" aria-hidden="true" />,
      tag: "Fundamentals",
      title: "Foundations that compound",
      description:
        "Ordered modules across fundamentals, backend, frontend, databases, DevOps, AI, and architecture - explained in plain language first, then deepened with trade-offs.",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-done-fg" aria-hidden="true" />,
      tag: "Growth",
      title: "From junior to senior",
      description:
        "Every topic starts simple and adds complexity gradually, so you can revisit the same ideas at a deeper level as your responsibilities grow.",
    },
    {
      icon: <Code2 className="h-5 w-5 text-danger-fg" aria-hidden="true" />,
      tag: "Practice",
      title: "Learning by doing",
      description:
        "Try each problem before reading on, then compare your approach against worked solutions, diagrams, and cheat sheets you will reuse at work.",
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-success-fg" aria-hidden="true" />,
      tag: "Momentum",
      title: "Current skills, steady habits",
      description:
        "AI tooling and modern stacks sit alongside the classics, while progress, bookmarks, and notes make a little learning every week easy to keep up.",
    },
  ];

  return (
    <>
      <HeroSection
        totalLessons={stats.totalLessons}
        totalProblems={stats.totalProblems}
        totalQuestions={stats.totalQuestions}
        totalCheatsheets={stats.totalCheatsheets}
        totalHours={stats.totalHours}
        totalCourses={courses.length}
        startHref={
          firstCourse ? `/${getCourseCategory(firstCourse.slug)}/courses/${firstCourse.slug}` : "/"
        }
        questionsHref={
          firstQuestionCategory ? `/${firstQuestionCategory}/question-answers` : "/search"
        }
      />

      {/* How it works — a small editorial 3-step strip */}
      <section className="border-b border-border bg-canvas-subtle py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="How it works"
            title="From blank stare to structured thinking"
            description="No gamified streaks, no hollow progress bars. Just the loop that moves the needle - whether you are picking up the basics or leveling up after years at work."
          />
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Pick a topic",
                body: "Start from a category like Backend or Database and follow a module end to end.",
              },
              {
                n: "02",
                title: "Work the problem",
                body: "Read the prompt, try it yourself, then compare against the worked approaches.",
              },
              {
                n: "03",
                title: "Track the gaps",
                body: "Bookmark, take notes, and mark lessons complete to see what still needs work.",
              },
            ].map((step) => (
              <li
                key={step.n}
                className="relative rounded-xl border border-border bg-canvas p-5 transition-colors hover:border-accent-fg/50"
              >
                <span className="font-mono text-sm font-semibold text-accent-fg">{step.n}</span>
                <h3 className="mt-2 font-semibold text-fg-default">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Curriculum — content-derived category band, not a fake feature grid */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="What's inside"
            title="A curriculum, not a content dump"
            description="Every category is organised into modules and ordered lessons — here's the shape of it."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="group flex gap-4 rounded-xl border border-border bg-canvas p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas-inset">
                  {pillar.icon}
                </span>
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-accent-fg">
                    {pillar.tag}
                  </p>
                  <h3 className="mt-1 font-semibold text-fg-default">{pillar.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {pillar.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Career growth — the long-run story, week by week */}
      <section className="border-b border-border bg-canvas-subtle py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Long-term growth"
            title="Built for the career, not just the course"
            description="A course is a milestone, not the finish line. The same material that gets you through a tough code review is what keeps you growing as an engineer - and the progress tools keep you consistent between the big goals."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {careerPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="group flex gap-4 rounded-xl border border-border bg-canvas p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas-inset">
                  {pillar.icon}
                </span>
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-accent-fg">
                    {pillar.tag}
                  </p>
                  <h3 className="mt-1 font-semibold text-fg-default">{pillar.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {pillar.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Courses preview */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Start here"
            title="Popular courses"
            description="Self-contained paths built for beginners and working professionals alike."
            className="mb-0"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course: Course) => {
              const category = getCourseCategory(course.slug);
              const Icon = CATEGORY_ICONS[category] ?? (
                <Layers className="h-4 w-4" aria-hidden="true" />
              );
              return (
                <Link
                  key={course.id}
                  href={`/${category}/courses/${course.slug}`}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-canvas p-5 transition-all hover:-translate-y-0.5 hover:border-accent-fg/50 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-fg-subtle">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-canvas-inset text-accent-fg">
                      {Icon}
                    </span>
                    <span className="capitalize">{category}</span>
                  </div>
                  <h3 className="text-base font-semibold text-fg-default transition-colors group-hover:text-accent-fg">
                    {course.title}
                  </h3>
                  <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-fg-muted">
                    {course.subtitle}
                  </p>
                  <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    {course.moduleSlugs.length} modules &middot; {formatCourseHours(course)} read
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-canvas px-6 py-12 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, var(--color-fg-default) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-fg-default sm:text-3xl">
                Learn it deeply. Keep growing after.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-fg-muted">
                Free, open, and no account required. Master the reasoning behind modern software, AI
                tooling, and programming — then track your progress when you&apos;re ready.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={
                    firstCourse
                      ? `/${getCourseCategory(firstCourse.slug)}/courses/${firstCourse.slug}`
                      : "/"
                  }
                  className="group inline-flex items-center gap-2 rounded-lg bg-accent-fg px-5 py-3 font-medium text-white transition-colors hover:bg-accent-emphasis"
                >
                  Start learning
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium text-fg-default transition-colors hover:bg-canvas-subtle"
                >
                  Search everything
                </Link>
              </div>
              <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-fg-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" aria-hidden="true" />
                  No sign-up to read
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" aria-hidden="true" />
                  Progress syncs when you log in
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" aria-hidden="true" />
                  Open source
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function formatCourseHours(course: Course): string {
  const hours = Math.max(1, Math.round((course.moduleSlugs.length || 1) * 1.5));
  return `${hours}h`;
}
