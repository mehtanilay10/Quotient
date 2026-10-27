import { Metadata } from "next";
import {
  courses,
  modules,
  lessons,
  getCourseBySlug,
  getLessonsForCourse,
  getContentItemHref,
  isProblemCourseSlug,
} from "@/lib/content";
import { ProgressDashboardClient } from "./ProgressDashboardClient";
import type { ProgressCatalog, ProgressModuleCourse } from "./ProgressDashboardClient";
import { ProgressErrorBoundary } from "@/components/progress/ProgressErrorBoundary";

export const metadata: Metadata = {
  title: "Progress Dashboard | Quotient",
  description: "Track your learning progress across courses, problems, and question answers.",
};

/**
 * Builds the compact catalog the dashboard needs. Lesson titles/hrefs are
 * resolved server-side so the client component never imports content data.
 */
function buildProgressCatalog(): ProgressCatalog {
  const courseEntries = courses.map((course) => {
    const courseLessons = getLessonsForCourse(course.slug);
    return {
      slug: course.slug,
      title: course.title,
      href: getContentItemHref(course.slug),
      lessonCount: courseLessons.length,
      totalMinutes: courseLessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0),
    };
  });

  // First module wins, mirroring `getModuleBySlug` in lib/content.ts.
  const moduleCourse: Record<string, ProgressModuleCourse> = {};
  for (const mod of modules) {
    if (mod.slug in moduleCourse) continue;
    if (mod.courseSlug === "question-answers") {
      moduleCourse[mod.slug] = {
        courseSlug: "question-answers",
        courseTitle: "Technical Question Answers",
      };
      continue;
    }
    const course = getCourseBySlug(mod.courseSlug);
    if (course) {
      moduleCourse[mod.slug] = { courseSlug: course.slug, courseTitle: course.title };
    }
  }

  const counts = {
    lessons: lessons.filter((lesson) => lesson.courseSlug !== "question-answers").length,
    problems: lessons.filter((lesson) => isProblemCourseSlug(lesson.courseSlug)).length,
    questions: lessons.filter((lesson) => lesson.courseSlug === "question-answers").length,
  };

  return { courses: courseEntries, moduleCourse, counts };
}

export default function ProgressPage() {
  return (
    <ProgressErrorBoundary>
      <ProgressDashboardClient catalog={buildProgressCatalog()} />
    </ProgressErrorBoundary>
  );
}
