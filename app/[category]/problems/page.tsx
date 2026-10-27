import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { SectionHeader } from "@/components/sections/SectionHeader";
import {
  getProblemCoursesByCategory,
  getCategoryMeta,
  getNavigationCategories,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

interface Params {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return getNavigationCategories()
    .filter((cat) => cat.sections.some((s) => s.href.endsWith("/problems")))
    .map((cat) => ({ category: cat.key }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const meta = getCategoryMeta(category);
  const courses = getProblemCoursesByCategory(category);
  if (courses.length === 0) return {};
  return buildMetadata({
    title: `${meta.label} Problems`,
    description: `Practice ${meta.label} problems with guided solutions and explanations.`,
    path: `/${category}/problems`,
  });
}

export default async function CategoryProblemsPage({ params }: Params) {
  const { category } = await params;
  const courses = getProblemCoursesByCategory(category);
  if (courses.length === 0) notFound();

  const meta = getCategoryMeta(category);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow={`${meta.icon} ${meta.label}`}
        title={`${meta.label} Problems`}
        description={`Practice sets for ${meta.label} — problems, guided solutions, and deep dives.`}
        titleAs="h1"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/${category}/problems/${course.slug}`}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-canvas p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-3xl" aria-hidden="true">
              {course.icon}
            </span>
            <h2 className="text-sm font-semibold text-fg-default group-hover:text-accent-fg transition-colors">
              {course.title}
            </h2>
            <p className="line-clamp-2 text-sm text-fg-muted flex-1">
              {course.subtitle || course.description}
            </p>
            <span className="flex items-center justify-between text-xs text-fg-subtle">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {course.moduleSlugs.length} sets
              </span>
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
