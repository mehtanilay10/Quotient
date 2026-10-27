import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { ProblemFilters } from "@/components/problems/ProblemFilters";
import {
  getCourseBySlug,
  getModulesForCourse,
  getLessonsForCourse,
  getProblemCourses,
  getCourseCategory,
  toLessonNavItems,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

interface Params {
  params: Promise<{ category: string; courseSlug: string }>;
}

export async function generateStaticParams() {
  return getProblemCourses().map((c) => ({
    courseSlug: c.slug,
    category: getCourseCategory(c.slug),
  }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const resolvedParams = await params;
  const { category, courseSlug } = resolvedParams;
  const course = getCourseBySlug(courseSlug);
  if (!course || course.category !== "problems") return {};
  if (category !== getCourseCategory(courseSlug)) return {};
  return buildMetadata({
    title: course.title,
    description: course.description,
    path: `/${category}/problems/${courseSlug}`,
  });
}

export default async function ProblemsCoursePage({ params }: Params) {
  const resolvedParams = await params;
  const category = resolvedParams?.category;
  const courseSlug = resolvedParams?.courseSlug;

  if (!category || !courseSlug) {
    notFound();
  }
  const course = getCourseBySlug(courseSlug);
  if (!course || course.category !== "problems") notFound();

  // Validate category matches
  const expectedCategory = getCourseCategory(courseSlug);
  if (category !== expectedCategory) notFound();

  const allModules = getModulesForCourse(courseSlug);
  const allLessons = getLessonsForCourse(courseSlug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow={`${course.icon} Problems`}
        title={course.title}
        description={course.description}
        titleAs="h1"
      />

      <ProblemFilters
        modules={allModules}
        lessons={toLessonNavItems(allLessons)}
        courseSlug={courseSlug}
        basePrefix={`${category}/problems`}
      />
    </div>
  );
}
