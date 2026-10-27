import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { ModuleCard } from "@/components/course/ModuleCard";
import {
  getAllCourses,
  getCourseBySlug,
  getModulesForCourse,
  getCourseCategory,
  isRegularCourse,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { CourseErrorBoundary } from "@/components/course/CourseErrorBoundary";

interface Params {
  params: Promise<{ category: string; courseSlug: string }>;
}

export async function generateStaticParams() {
  return getAllCourses().map((c) => ({
    courseSlug: c.slug,
    category: getCourseCategory(c.slug),
  }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const resolvedParams = await params;
  const { category, courseSlug } = resolvedParams;
  const course = getCourseBySlug(courseSlug);
  // Only genuine courses render here; problems/cheatsheets/question-answers have
  // their own route trees.
  if (!course || !isRegularCourse(course)) return {};
  if (category !== getCourseCategory(courseSlug)) return {};
  return buildMetadata({
    title: course.title,
    description: course.description,
    path: `/${category}/courses/${courseSlug}`,
  });
}

export default async function CourseDetailPage({ params }: Params) {
  const resolvedParams = await params;
  const category = resolvedParams?.category;
  const courseSlug = resolvedParams?.courseSlug;

  if (!category || !courseSlug) {
    notFound();
  }
  const course = getCourseBySlug(courseSlug);
  // Only genuine courses render here; problems/cheatsheets/question-answers have
  // their own route trees.
  if (!course || !isRegularCourse(course)) notFound();

  // Validate category matches
  const expectedCategory = getCourseCategory(courseSlug);
  if (category !== expectedCategory) notFound();

  const allModules = getModulesForCourse(courseSlug);

  return (
    <CourseErrorBoundary>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <SectionHeader
          eyebrow={`${course.icon} Course`}
          title={course.title}
          description={course.description}
          titleAs="h1"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allModules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              courseSlug={courseSlug}
              basePrefix={`${category}/courses`}
              lessonCount={mod.lessonSlugs?.length ?? 0}
            />
          ))}
        </div>
      </div>
    </CourseErrorBoundary>
  );
}
