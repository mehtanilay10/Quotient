import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { ReadingTimeBadge } from "@/components/ui/ReadingTimeBadge";
import {
  getCategoryMeta,
  getQuestionCategories,
  getQuestionAnswersByDifficulty,
  getQuestionTechnologies,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatHours } from "@/lib/utils";

interface Params {
  params: Promise<{ category: string; technology: string }>;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export async function generateStaticParams() {
  const params: { category: string; technology: string }[] = [];
  for (const category of getQuestionCategories()) {
    for (const tech of getQuestionTechnologies(category)) {
      params.push({ category, technology: tech.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, technology } = await params;
  const tech = getQuestionTechnologies(category).find((t) => t.slug === technology);
  if (!tech) return {};
  const meta = getCategoryMeta(category);
  return buildMetadata({
    title: `${tech.title} Question Answers`,
    description: `${tech.questionCount} ${meta.label} ${tech.title} questions with detailed answers.`,
    path: `/${category}/question-answers/${technology}`,
  });
}

export default async function QuestionTechnologyPage({ params }: Params) {
  const { category, technology } = await params;
  const tech = getQuestionTechnologies(category).find((t) => t.slug === technology);
  if (!tech) notFound();

  const groups = getQuestionAnswersByDifficulty(tech.slug, category);
  const totalCount = groups.reduce((sum, group) => sum + group.questions.length, 0);
  const totalMinutes = groups.reduce(
    (sum, group) =>
      sum + group.questions.reduce((groupSum, q) => groupSum + (q.estimatedMinutes || 0), 0),
    0
  );

  const categoryMeta = getCategoryMeta(category);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href={`/${category}/question-answers`}
          className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-accent-fg"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {categoryMeta.label} question answers
        </Link>
      </div>

      <SectionHeader
        eyebrow={`${tech.icon} ${categoryMeta.label}`}
        title={`${tech.title} Question Answers`}
        description={tech.description}
        titleAs="h1"
      />

      <div className="mb-8 flex items-center gap-4 text-xs text-fg-subtle">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          {totalCount} questions
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatHours(totalMinutes)}
        </span>
      </div>

      {groups.map((group) => (
        <section key={group.difficulty} className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-fg-default">
              {DIFFICULTY_LABELS[group.difficulty] ?? group.difficulty}
            </h2>
            <span className="text-xs text-fg-subtle">
              {group.questions.length} question{group.questions.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3">
            {group.questions.map((q) => (
              <Link
                key={q.id}
                href={`/${category}/question-answers/${technology}/${q.slug}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-canvas p-4 transition-all hover:border-accent-fg hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg-default transition-colors group-hover:text-accent-fg">
                    {q.title}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-fg-muted">{q.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <ReadingTimeBadge minutes={q.estimatedMinutes} />
                  <BookOpen className="h-4 w-4 text-fg-subtle" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
