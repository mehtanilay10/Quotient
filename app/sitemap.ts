import { MetadataRoute } from "next";
import {
  getAllCourses,
  getProblemCourses,
  getModulesForCourse,
  getLessonsForCourse,
  getQuestionTechnologies,
  getQuestionAnswers,
  getNavigationCategories,
  getRoadmaps,
} from "@/lib/content";
import { getCourseCategory } from "@/lib/content-hrefs";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quotient.dev";

function toSitemapEntry(
  url: string,
  priority = 0.8,
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] = "monthly",
  lastModified?: Date
): MetadataRoute.Sitemap[0] {
  return {
    url,
    lastModified: lastModified ?? new Date(),
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    toSitemapEntry(`${BASE_URL}/`, 1, "weekly"),
    toSitemapEntry(`${BASE_URL}/search`, 0.7, "weekly"),
    toSitemapEntry(`${BASE_URL}/ai/glossary`, 0.8, "weekly"),
    toSitemapEntry(`${BASE_URL}/ai/prompts`, 0.8, "weekly"),
  ];

  const courses = getAllCourses().filter((c) => !c.isQuestionAnswer);

  // Category listing pages (/[category]/courses, /problems, /cheatsheets)
  for (const cat of getNavigationCategories()) {
    for (const section of cat.sections) {
      entries.push(toSitemapEntry(`${BASE_URL}${section.href}`, 0.8, "weekly"));
    }
  }

  // Curated category roadmap pages (/[category]/roadmap).
  for (const roadmap of getRoadmaps()) {
    entries.push(toSitemapEntry(`${BASE_URL}/${roadmap.category}/roadmap`, 0.8, "weekly"));
  }

  for (const course of courses) {
    const category = getCourseCategory(course.slug);
    entries.push(toSitemapEntry(`${BASE_URL}/${category}/courses/${course.slug}`));

    const modules = getModulesForCourse(course.slug);
    const courseLessons = getLessonsForCourse(course.slug);
    for (const mod of modules) {
      entries.push(toSitemapEntry(`${BASE_URL}/${category}/courses/${course.slug}/${mod.slug}`));

      const lessons = courseLessons.filter((l) => l.moduleSlug === mod.slug);
      for (const lesson of lessons) {
        entries.push(
          toSitemapEntry(
            `${BASE_URL}/${category}/courses/${course.slug}/${mod.slug}/${lesson.slug}`
          )
        );
      }
    }
  }

  const technologies = getQuestionTechnologies();
  for (const tech of technologies) {
    entries.push(toSitemapEntry(`${BASE_URL}/${tech.category}/question-answers`, 0.8, "weekly"));
    entries.push(toSitemapEntry(`${BASE_URL}/${tech.category}/question-answers/${tech.slug}`));

    const questions = getQuestionAnswers(tech.slug, tech.category);
    for (const q of questions) {
      entries.push(
        toSitemapEntry(`${BASE_URL}/${tech.category}/question-answers/${tech.slug}/${q.slug}`)
      );
    }
  }

  const cheatsheetModules = getModulesForCourse("cheatsheet");
  for (const mod of cheatsheetModules) {
    const category = getCourseCategory(mod.slug);
    entries.push(toSitemapEntry(`${BASE_URL}/${category}/cheatsheets/${mod.slug}`));
  }

  const problemCourses = getProblemCourses();

  for (const course of problemCourses) {
    const category = getCourseCategory(course.slug);
    entries.push(toSitemapEntry(`${BASE_URL}/${category}/problems/${course.slug}`, 0.8, "weekly"));

    const modules = getModulesForCourse(course.slug);
    const courseLessons = getLessonsForCourse(course.slug);
    for (const mod of modules) {
      entries.push(toSitemapEntry(`${BASE_URL}/${category}/problems/${course.slug}/${mod.slug}`));

      const lessons = courseLessons.filter((l) => l.moduleSlug === mod.slug);
      for (const lesson of lessons) {
        entries.push(
          toSitemapEntry(
            `${BASE_URL}/${category}/problems/${course.slug}/${mod.slug}/${lesson.slug}`
          )
        );
      }
    }
  }

  // The navigation-category loop can re-produce URLs already present in the
  // static list (e.g. /ai/glossary and /ai/prompts are now AI nav sections).
  // Keep the first occurrence so priorities stay stable and no URL repeats.
  const seen = new Set<string>();
  const unique: MetadataRoute.Sitemap = [];
  for (const entry of entries) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    unique.push(entry);
  }
  return unique;
}
