/**
 * Href builders for content routes, plus technology-slug helpers.
 *
 * This module is deliberately *content-free*: it only reads the tiny generated
 * `content/categories.ts` lookup and static maps declared below. Client
 * components (search suggestions, search results, bookmarks, …) import href
 * helpers from here — importing `lib/content.ts` instead would pull every
 * lesson JSON into the browser bundle, which bloats the client chunks and
 * slows down every build.
 *
 * `lib/content.ts` re-exports everything in this file, so server code can keep
 * importing these helpers from `@/lib/content`.
 */

import {
  COURSE_URL_CATEGORY,
  PROBLEM_COURSE_SLUGS,
  QUESTION_TECH_CATEGORY,
  QUESTION_LESSON_TECH,
} from "@/content/categories";
import type { SearchResult } from "@/types";

// ── Course category / problem lookups ────────────────────────────────────────

// Legacy hand-maintained fallback for slugs the generator doesn't see (the
// generated `COURSE_URL_CATEGORY` above is the primary source of truth).
const COURSE_CATEGORY_MAP: Record<string, string> = {
  // Fundamentals
  "programming-computer-web-foundations": "fundamentals",
  "oops-concepts": "fundamentals",
  "senior-software-engineering": "fundamentals",
  // AI
  "ai-basics": "ai",
  "dotnet-ai-backend": "ai",
  // Backend (.NET)
  "csharp-fundamentals": "backend",
  linq: "backend",
  "ef-core": "backend",
  "aspnet-core": "backend",
  "aspnet-core-web-api": "backend",
  "dotnet-nuget-packages": "backend",
  "unit-testing-dotnet": "backend",
  "authentication-authorization": "backend",
  "graphql-dotnet": "backend",
  "aws-for-aspnet": "backend",
  "azure-for-aspnet": "backend",
  // Frontend
  "react-fundamentals": "frontend",
  "typescript-for-react": "frontend",
  redux: "frontend",
  "react-query": "frontend",
  "react-testing": "frontend",
  apollo: "frontend",
  "react-advanced-patterns": "frontend",
  "next-js-full-stack-react": "frontend",
  prisma: "frontend",
  "yarn-npm-packages": "frontend",
  // Database
  postgresql: "database",
  "sql-server": "database",
  // Cloud → DevOps
  aws: "devops",
  azure: "devops",
  // DevOps
  devops: "devops",
  "git-linux-developer-workflow": "devops",
  // Architecture
  "design-patterns": "architecture",
  "clean-code-csharp": "architecture",
  "redis-caching-strategies": "architecture",
  "fullstack-security": "architecture",
  "message-queues-event-streaming": "architecture",
  "microservices-architecture": "architecture",
  "system-design-course": "architecture",
  "frontend-performance-engineering": "architecture",
  // Cheatsheets (module slugs)
  csharp: "backend",
  javascript: "frontend",
  react: "frontend",
  "react-router": "frontend",
  typescript: "frontend",
  graphql: "backend",
  "docker-compose": "devops",
  // Problems (course slugs)
  "api-design": "backend",
  asp: "backend",
  "database-design": "database",
  sql: "database",
  "architecture-decisions": "architecture",
  "code-review": "architecture",
  hld: "architecture",
  lld: "architecture",
  "distributed-systems": "architecture",
  "full-stack-senior-projects": "architecture",
  "low-level-design": "architecture",
  "production-incidents": "architecture",
  "system-design": "architecture",
};

const problemCourseSlugs = new Set<string>(PROBLEM_COURSE_SLUGS);

export function getCourseCategory(slug: string): string {
  // Prefer the directory-derived category stamped by the content generator.
  const indexed = COURSE_URL_CATEGORY[slug];
  if (indexed) return indexed;
  return COURSE_CATEGORY_MAP[slug] ?? "courses";
}

export function isProblemCourseSlug(slug: string | undefined): boolean {
  return slug !== undefined && problemCourseSlugs.has(slug);
}

/**
 * Builds the canonical, category-prefixed href for a stored
 * (courseSlug, moduleSlug, lessonSlug) triple — e.g. from bookmarks,
 * notes, or progress records. All course/problem routes live under
 * `/[category]/...`, so links must include the resolved category.
 */
export function getContentItemHref(
  courseSlug: string,
  moduleSlug?: string | null,
  lessonSlug?: string | null
): string {
  if (courseSlug === "question-answers") {
    const tech = getQuestionTechnologySlug(moduleSlug, lessonSlug);
    const category = tech ? getQuestionTechCategory(tech) : undefined;
    if (!tech || !category) return "/";
    return lessonSlug
      ? `/${category}/question-answers/${tech}/${lessonSlug}`
      : `/${category}/question-answers/${tech}`;
  }

  // Cheatsheets: one lesson per technology module; the category is derived
  // from the technology (module) slug, not a course.
  if (courseSlug === "cheatsheet") {
    if (moduleSlug) {
      return `/${getCourseCategory(moduleSlug)}/cheatsheets/${moduleSlug}`;
    }
    return "/";
  }

  const category = getCourseCategory(courseSlug);
  const prefix = isProblemCourseSlug(courseSlug) ? "problems" : "courses";

  if (moduleSlug && lessonSlug) {
    return `/${category}/${prefix}/${courseSlug}/${moduleSlug}/${lessonSlug}`;
  }
  if (moduleSlug) {
    return `/${category}/${prefix}/${courseSlug}/${moduleSlug}`;
  }
  return `/${category}/${prefix}/${courseSlug}`;
}

// ── Question-answer technology slugs ─────────────────────────────────────────

/**
 * Display name → URL slug for every question-answer technology.
 *
 * The technology slug is also the module slug, so the same value is used in the
 * content tree (`content/<category>/question-answers/<slug>/`) and in the URL
 * (`/<category>/question-answers/<slug>/`). The generated `QUESTION_LESSON_TECH`
 * map is authoritative for runtime lookups; this map only converts a lesson's
 * display name into a slug.
 *
 * Maintenance rule: when adding a new question-answer technology, update this
 * map alongside the lesson JSON `technology` field. Slugs that need no special
 * casing may be omitted — they fall back to a generic slugify.
 */
const TECH_SLUG_MAP: Record<string, string> = {
  "c#": "csharp",
  "asp.net core": "aspnet-core",
  oop: "oop",
  javascript: "javascript",
  general: "general",
  "system design": "system-design",
  behavioral: "behavioral",
  "sql server": "sql-server",
  "full-stack scenarios": "fullstack-scenarios",
  "performance optimization": "performance-optimization",
  "ci/cd pipelines": "cicd-pipelines",
  "entity framework core": "entity-framework-core",
  "backend & database": "backend-database",
  react: "react",
  architecture: "architecture",
  security: "security",
};

/** URL-safe fallback for technologies without an explicit map entry. */
function fallbackTechSlug(technology: string): string {
  return technology
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Converts a lesson `technology` value (e.g. "C#", "CI/CD Pipelines") to its URL slug. */
export function getQuestionTechSlug(technology: string): string {
  const key = technology.trim().toLowerCase();
  return TECH_SLUG_MAP[key] ?? fallbackTechSlug(key);
}

// Reverse of TECH_SLUG_MAP for turning a slug back into a display name
// (e.g. `csharp` -> "C#"). Built once from the canonical map above.
const TECH_NAME_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(TECH_SLUG_MAP).map(([name, slug]) => [slug, name])
);

/**
 * Converts a URL slug back into a human-readable technology name, e.g.
 * `csharp` -> "C#", `aspnet-core` -> "ASP.NET Core". Falls back to a
 * title-cased version of the slug when the slug is not in the known map.
 */
export function getQuestionTechName(slug: string): string {
  const known = TECH_NAME_BY_SLUG[slug];
  if (known) {
    // Restore conventional capitalisation for names stored lowercase.
    return known
      .split(" ")
      .map((word) =>
        word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ")
      .replace(/\bC#\b/i, "C#")
      .replace(/\bOop\b/i, "OOP")
      .replace(/\bSql\b/i, "SQL")
      .replace(/\bCi\/cd\b/i, "CI/CD");
  }
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** The content category a question-answer technology lives in (e.g. "backend"). */
export function getQuestionTechCategory(technologySlug: string): string | undefined {
  return QUESTION_TECH_CATEGORY[technologySlug];
}

/**
 * Resolves the technology that owns a question answer.
 *
 * `moduleSlug` is the technology slug for records created after the
 * category-first restructure. Records created before it stored the old
 * level-based module slug, so the question slug is used as a fallback.
 */
function getQuestionTechnologySlug(
  moduleSlug?: string | null,
  lessonSlug?: string | null
): string | undefined {
  if (lessonSlug && QUESTION_LESSON_TECH[lessonSlug]) return QUESTION_LESSON_TECH[lessonSlug];
  if (moduleSlug && QUESTION_TECH_CATEGORY[moduleSlug]) return moduleSlug;
  return moduleSlug ?? undefined;
}

// ── Search result hrefs ──────────────────────────────────────────────────────

export function getSearchResultHref(result: SearchResult): string {
  if (result.type === "lesson") {
    const category = getCourseCategory(result.courseSlug ?? "");
    if (isProblemCourseSlug(result.courseSlug)) {
      return `/${category}/problems/${result.courseSlug}/${result.moduleSlug}/${result.slug}`;
    }
    if (result.courseSlug === "question-answers") {
      const tech =
        getQuestionTechnologySlug(result.moduleSlug, result.slug) ??
        (result.technology ? getQuestionTechSlug(result.technology) : undefined);
      const techCategory = tech ? getQuestionTechCategory(tech) : undefined;
      if (tech && techCategory) {
        return `/${techCategory}/question-answers/${tech}/${result.slug}`;
      }
      return "/";
    }
    if (result.courseSlug === "cheatsheet") {
      // Every cheat-sheet lesson has slug `cheatsheet`; the URL segment is the
      // module (technology) slug, not the lesson slug.
      return result.moduleSlug ? `/${category}/cheatsheets/${result.moduleSlug}` : "/";
    }
    if (isProblemCourseSlug(result.courseSlug)) {
      return `/${category}/problems/${result.courseSlug}/${result.moduleSlug}/${result.slug}`;
    }
    return `/${category}/courses/${result.courseSlug}/${result.moduleSlug}/${result.slug}`;
  }

  if (result.type === "module") {
    const category = getCourseCategory(result.courseSlug ?? "");
    if (result.courseSlug === "cheatsheet") {
      return `/${category}/cheatsheets/${result.slug}`;
    }
    if (result.courseSlug === "question-answers") {
      const techCategory = getQuestionTechCategory(result.slug);
      return techCategory ? `/${techCategory}/question-answers/${result.slug}` : "/";
    }
    if (isProblemCourseSlug(result.courseSlug)) {
      return `/${category}/problems/${result.courseSlug}/${result.slug}`;
    }
    return `/${category}/courses/${result.courseSlug}/${result.slug}`;
  }

  if (result.type === "course") {
    // The question-answers pseudo-course has no landing page of its own — its
    // questions are listed per category.
    if (result.slug === "question-answers") {
      return "/";
    }
    const category = getCourseCategory(result.slug);
    if (isProblemCourseSlug(result.slug)) {
      return `/${category}/problems/${result.slug}`;
    }
    return `/${category}/courses/${result.slug}`;
  }

  if (result.type === "cheatsheet") {
    return "/";
  }

  return "/";
}
