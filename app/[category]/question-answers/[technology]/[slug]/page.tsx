import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  getCategoryMeta,
  getQuestionCategories,
  getQuestionAnswers,
  getQuestionTechnologies,
  getLessonBySlug,
} from "@/lib/content";
import { buildLessonMetadata } from "@/lib/seo";
import { ContentBlockRenderer } from "@/components/content/ContentBlockRenderer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ReadingTimeBadge } from "@/components/ui/ReadingTimeBadge";
import { LessonActions } from "@/components/progress/LessonActions";
import { LessonNotesButton } from "@/components/lesson/LessonNotesButton";
import { NotesModalProvider } from "@/components/lesson/NotesModalContext";
import { OfflineSaveButton } from "@/components/lesson/OfflineSaveButton";

interface Params {
  params: Promise<{ category: string; technology: string; slug: string }>;
}

// Every question answer is prerendered to a static file at build time. This
// is safe for Vercel's per-deployment route limit only because `cacheComponents`
// is disabled in next.config.ts (see the course lesson page for details).
export async function generateStaticParams() {
  const params: { category: string; technology: string; slug: string }[] = [];
  for (const category of getQuestionCategories()) {
    for (const tech of getQuestionTechnologies(category)) {
      for (const question of getQuestionAnswers(tech.slug, category)) {
        params.push({ category, technology: tech.slug, slug: question.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, technology, slug } = await params;
  const tech = getQuestionTechnologies(category).find((t) => t.slug === technology);
  if (!tech) return {};
  // Scope by module (technology): a question slug could repeat across topics.
  const lesson = getLessonBySlug(slug, "question-answers", technology);
  if (!lesson) return {};
  return buildLessonMetadata({
    title: lesson.title,
    description: lesson.description,
    moduleSlug: technology,
    lessonSlug: slug,
    basePath: `/${category}/question-answers`,
  });
}

export default async function QuestionAnswerPage({ params }: Params) {
  const { category, technology, slug } = await params;

  const tech = getQuestionTechnologies(category).find((t) => t.slug === technology);
  if (!tech) notFound();

  const lesson = getLessonBySlug(slug, "question-answers", technology);
  if (!lesson) notFound();

  const allQuestions = getQuestionAnswers(technology, category);
  const currentIdx = allQuestions.findIndex((q) => q.slug === slug);
  const prev = currentIdx > 0 ? allQuestions[currentIdx - 1] : null;
  const next = currentIdx < allQuestions.length - 1 ? allQuestions[currentIdx + 1] : null;

  const categoryMeta = getCategoryMeta(category);

  return (
    <NotesModalProvider
      courseSlug="question-answers"
      moduleSlug={technology}
      lessonSlug={lesson.slug}
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Breadcrumbs
          items={[
            {
              label: `${categoryMeta.label} Question Answers`,
              href: `/${category}/question-answers`,
            },
            { label: tech.title, href: `/${category}/question-answers/${technology}` },
            { label: lesson.title },
          ]}
          className="mb-4"
        />

        <header className="mb-8">
          <LessonActions
            lesson={{
              slug: lesson.slug,
              title: lesson.title,
              difficulty: lesson.difficulty,
              estimatedMinutes: lesson.estimatedMinutes,
              isOptional: lesson.isOptional,
              tags: lesson.tags,
            }}
            courseSlug="question-answers"
            moduleSlug={technology}
            category="questionAnswers"
          >
            <LessonNotesButton
              courseSlug="question-answers"
              moduleSlug={technology}
              lessonSlug={lesson.slug}
            />
            <OfflineSaveButton
              courseSlug="question-answers"
              moduleSlug={technology}
              lessonSlug={lesson.slug}
              title={lesson.title}
            />
          </LessonActions>
          <h1 className="mb-2 text-2xl font-bold leading-snug text-fg-default sm:text-3xl">
            {lesson.title}
          </h1>
          <p className="text-base text-fg-muted">{lesson.description}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-fg-subtle">
            <span>
              {tech.icon} {tech.title}
            </span>
            <ReadingTimeBadge minutes={lesson.estimatedMinutes} />
          </div>
        </header>

        <div id="question-content" className="prose prose-slate dark:prose-invert max-w-none">
          <ContentBlockRenderer blocks={lesson.blocks} />
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
          {prev ? (
            <Link
              href={`/${category}/question-answers/${technology}/${prev.slug}`}
              data-lesson-nav="prev"
              className="flex max-w-[45%] items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent-fg hover:text-accent-fg"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{prev.title}</span>
            </Link>
          ) : (
            <div />
          )}
          {next && (
            <Link
              href={`/${category}/question-answers/${technology}/${next.slug}`}
              data-lesson-nav="next"
              className="flex max-w-[45%] items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent-fg hover:text-accent-fg"
            >
              <span className="line-clamp-1">{next.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </NotesModalProvider>
  );
}
