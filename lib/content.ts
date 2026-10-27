/**
 * Content loading and indexing helpers.
 * All content is loaded from structured TypeScript files in /content/.
 * These helpers provide cross-content lookups and navigation utilities.
 */

import { modules, getModulesByCourse } from "@/content/modules";
import { lessons, getLessonsByModule } from "@/content/lessons";
import { courses } from "@/content/courses";
import { roadmaps } from "@/content/roadmaps";
import { glossaryTerms } from "@/content/ai/glossary";
import { promptTemplates } from "@/content/ai/prompts";
import { computeHeadingAnchors } from "@/lib/utils";
import {
  getCourseCategory,
  isProblemCourseSlug,
  getContentItemHref,
  getSearchResultHref,
  getQuestionTechCategory,
  getQuestionTechName,
} from "@/lib/content-hrefs";
import type {
  Module,
  Lesson,
  Course,
  TocEntry,
  ContentBlock,
  SearchResult,
  Difficulty,
  GlossaryTerm,
  PromptTemplate,
  LessonNavItem,
  Roadmap,
  RoadmapStep,
  ResolvedRoadmapStep,
} from "@/types";

// ── Re-exports for convenience ────────────────────────────────────────────────
export { modules, lessons, courses };

// Href builders live in `lib/content-hrefs.ts` (content-free, safe to import
// from client components) and are re-exported here so server code only ever
// needs a single import.
export {
  getCourseCategory,
  isProblemCourseSlug,
  getContentItemHref,
  getSearchResultHref,
  getQuestionTechCategory,
  getQuestionTechName,
};

/** Difficulty levels in the order they are presented to learners. */
const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

// ── Shared caches for derived content lookups ────────────────────────────────
// Content is bundled statically (JSON imports), so it never changes during the
// lifetime of a process. During `next build` each helper below runs for every
// one of the ~4,100 generated pages (plus every generateStaticParams call), so
// uncached linear scans over all ~2,800 lessons / ~560 modules are repeated
// thousands of times. Derived lists and lookup indexes are computed on first
// use and reused afterwards. Arrays returned from these helpers are shared —
// treat them as read-only (callers only ever read/filter/map them).

function memoizeNoArg<R>(compute: () => R): () => R {
  let result: R | undefined;
  let initialized = false;
  return () => {
    if (!initialized) {
      result = compute();
      initialized = true;
    }
    return result as R;
  };
}

// ── Course helpers ────────────────────────────────────────────────────────────

const allCoursesCache = memoizeNoArg(() =>
  [...courses]
    // `problems`, `cheatsheet`, and `question-answers` are pseudo-courses that
    // reuse the course model but have their own dedicated route trees.
    // Including them here would generate duplicate `/courses/...` pages.
    .filter(
      (c) =>
        c.category !== "problems" &&
        c.category !== "cheatsheet" &&
        c.category !== "question-answers"
    )
    .sort((a, b) => a.order - b.order)
);

export function getAllCourses(): Course[] {
  return allCoursesCache();
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

/**
 * Whether a course is served by the generic `/[category]/courses/[courseSlug]`
 * route tree.
 *
 * Problem sets, cheat sheets, and question answers all reuse the course model but
 * own dedicated route trees of their own, so they must not resolve on the
 * course routes. Note that a course's `category` field is **not** the URL
 * category — content JSON stamps values like `"category": "basics"` or
 * `"category": "backend"` — so this compares against the pseudo-course values
 * only (`'problems' | 'cheatsheet' | 'question-answers'`), never the URL segment.
 */
export function isRegularCourse(course: Course): boolean {
  return (
    course.category !== "problems" &&
    course.category !== "cheatsheet" &&
    course.category !== "question-answers"
  );
}

const problemCoursesCache = memoizeNoArg(() =>
  courses.filter((c) => c.category === "problems").sort((a, b) => a.order - b.order)
);

export function getProblemCourses(): Course[] {
  return problemCoursesCache();
}

// ── Category / navigation helpers ────────────────────────────────────────────
// Categories are derived from the content directory structure (stamped as
// `urlCategory` by the content generator) so the navigation always matches
// the content that actually exists.

export interface CategoryMeta {
  label: string;
  icon: string;
}

/** Display metadata for known categories. Unknown categories fall back to a generic label. */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  backend: { label: "Backend", icon: "⚙️" },
  frontend: { label: "Frontend", icon: "⚛️" },
  database: { label: "Database", icon: "🗄️" },
  ai: { label: "AI", icon: "🤖" },
  devops: { label: "DevOps", icon: "🚀" },
  architecture: { label: "Architecture", icon: "🏗️" },
  fundamentals: { label: "Fundamentals", icon: "🌱" },
};

/** Preferred display order; any other categories found in content are appended alphabetically. */
const CATEGORY_ORDER = ["backend", "frontend", "database", "ai", "devops", "architecture"];

/** Categories that exist in content but are intentionally omitted from the navigation bar. */
const HIDDEN_CATEGORIES = new Set(["fundamentals"]);

export function getCategoryMeta(category: string): CategoryMeta {
  return (
    CATEGORY_META[category] ?? {
      label: category.charAt(0).toUpperCase() + category.slice(1),
      icon: "📚",
    }
  );
}

const subjectCoursesCache = memoizeNoArg(() => getAllCourses().filter((c) => !c.isQuestionAnswer));

export function getSubjectCourses(): Course[] {
  return subjectCoursesCache();
}

export function getCoursesByCategory(category: string): Course[] {
  return getSubjectCourses().filter((c) => getCourseCategory(c.slug) === category);
}

export function getProblemCoursesByCategory(category: string): Course[] {
  return getProblemCourses().filter((c) => getCourseCategory(c.slug) === category);
}

const cheatsheetModulesCache = memoizeNoArg(() =>
  modules.filter((m) => m.courseSlug === "cheatsheet").sort((a, b) => a.order - b.order)
);

export function getCheatsheetModules(): Module[] {
  return cheatsheetModulesCache();
}

/** Collision-safe lookup: cheatsheet technology slugs can collide with course module slugs. */
export function getCheatsheetModuleBySlug(slug: string): Module | undefined {
  return modules.find((m) => m.slug === slug && m.courseSlug === "cheatsheet");
}

export function getCheatsheetModulesByCategory(category: string): Module[] {
  return getCheatsheetModules().filter((m) => getCourseCategory(m.slug) === category);
}

// ── Roadmap helpers ──────────────────────────────────────────────────────────

const roadmapsByCategoryCache = memoizeNoArg(() => {
  const map = new Map<string, Roadmap>();
  for (const roadmap of roadmaps) map.set(roadmap.category, roadmap);
  return map;
});

/** The curated roadmap for a category, if one exists. */
export function getRoadmapByCategory(category: string): Roadmap | undefined {
  return roadmapsByCategoryCache().get(category);
}

/** Every roadmap, ordered by the canonical category order. */
export function getRoadmaps(): Roadmap[] {
  return [...roadmaps].sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
}

/**
 * Resolves one roadmap step against the content graph so the roadmap page can
 * render the target's real title, description, icon, and lesson/question count.
 * Returns `null` when the referenced content no longer exists.
 */
export function resolveRoadmapStep(step: RoadmapStep): ResolvedRoadmapStep | null {
  if (step.kind === "link") {
    return {
      kind: "link",
      title: step.title ?? step.ref,
      description: "",
      href: step.ref,
      icon: "🔗",
      note: step.note,
    };
  }

  if (step.kind === "cheatsheet") {
    const mod = modules.find((m) => m.slug === step.ref && m.courseSlug === "cheatsheet");
    if (!mod) return null;
    return {
      kind: "cheatsheet",
      title: mod.title,
      description: mod.description,
      href: `/${getCourseCategory(mod.slug)}/cheatsheets/${mod.slug}`,
      icon: mod.icon,
      note: step.note,
    };
  }

  if (step.kind === "questionAnswer") {
    const tech = getQuestionTechnologies().find((t) => t.slug === step.ref);
    if (!tech) return null;
    return {
      kind: "questionAnswer",
      title: tech.title,
      description: tech.description,
      href: `/${getQuestionTechCategory(tech.slug)}/question-answers/${tech.slug}`,
      icon: tech.icon,
      meta: `${tech.questionCount} question${tech.questionCount === 1 ? "" : "s"}`,
      note: step.note,
    };
  }

  // 'course' and 'problems' both resolve against the course graph — a problem
  // set is a course that lives under a `problems/` directory.
  const course = courses.find((c) => c.slug === step.ref);
  if (!course) return null;
  const lessonCount = getLessonsForCourse(step.ref).length;
  return {
    kind: step.kind,
    title: course.title,
    description: course.description,
    href: getContentItemHref(step.ref),
    icon: course.icon,
    meta: `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`,
    note: step.note,
  };
}

export interface NavSection {
  label: string;
  href: string;
  count: number;
}

export interface NavCategory {
  key: string;
  label: string;
  icon: string;
  sections: NavSection[];
}

/**
 * Returns every category that has content, each with the sections
 * (Courses / Problems / Cheat Sheets) that actually exist for it.
 * This drives the navigation bar on desktop and mobile.
 */
function computeNavigationCategories(): NavCategory[] {
  const courseList = getSubjectCourses();
  const problemList = getProblemCourses();
  const cheatsheetList = getCheatsheetModules();
  const questionList = getQuestionTechnologies();
  const roadmapMap = roadmapsByCategoryCache();

  const present = new Set<string>();
  for (const c of courseList) present.add(getCourseCategory(c.slug));
  for (const c of problemList) present.add(getCourseCategory(c.slug));
  for (const m of cheatsheetList) present.add(getCourseCategory(m.slug));
  for (const t of questionList) present.add(t.category);

  const ordered = [
    ...CATEGORY_ORDER.filter((key) => present.has(key)),
    ...[...present].filter((key) => !CATEGORY_ORDER.includes(key)).sort(),
  ].filter((key) => !HIDDEN_CATEGORIES.has(key));

  return ordered.map((key) => {
    const meta = getCategoryMeta(key);
    const roadmap = roadmapMap.get(key);
    const sections: NavSection[] = [
      ...(roadmap
        ? [
            {
              label: "Roadmap",
              href: `/${key}/roadmap`,
              count: roadmap.stages.length,
            } as NavSection,
          ]
        : []),
      {
        label: "Courses",
        href: `/${key}/courses`,
        count: courseList.filter((c) => getCourseCategory(c.slug) === key).length,
      },
      {
        label: "Problems",
        href: `/${key}/problems`,
        count: problemList.filter((c) => getCourseCategory(c.slug) === key).length,
      },
      {
        label: "Cheat Sheets",
        href: `/${key}/cheatsheets`,
        count: cheatsheetList.filter((m) => getCourseCategory(m.slug) === key).length,
      },
      {
        label: "Question Answers",
        href: `/${key}/question-answers`,
        count: questionList.filter((t) => t.category === key).length,
      },
    ].filter((s) => s.count > 0);

    // Site-wide AI resources hang off the AI category so they show up in the
    // nav bar dropdown, the mobile accordion, and the footer category list.
    if (key === "ai") {
      sections.push(
        { label: "Glossary", href: "/ai/glossary", count: glossaryTerms.length },
        { label: "Prompt Templates", href: "/ai/prompts", count: promptTemplates.length }
      );
    }

    return { key, label: meta.label, icon: meta.icon, sections };
  });
}

// Computed twice per page render (Navbar + Footer) — cache for the process.
const navigationCategoriesCache = memoizeNoArg(computeNavigationCategories);

export function getNavigationCategories(): NavCategory[] {
  return navigationCategoriesCache();
}

const modulesForCourseCache = new Map<string, Module[]>();

export function getModulesForCourse(courseSlug: string): Module[] {
  const cached = modulesForCourseCache.get(courseSlug);
  if (cached) return cached;
  const result = getModulesByCourse(courseSlug);
  modulesForCourseCache.set(courseSlug, result);
  return result;
}

const lessonsForCourseCache = new Map<string, Lesson[]>();

export function getLessonsForCourse(courseSlug: string): Lesson[] {
  const cached = lessonsForCourseCache.get(courseSlug);
  if (cached) return cached;

  const courseModules = getModulesByCourse(courseSlug);
  const moduleSlugs = new Set(courseModules.map((m) => m.slug));
  const moduleOrder = new Map(courseModules.map((m) => [m.slug, m.order]));
  const result = lessons
    .filter((l) => moduleSlugs.has(l.moduleSlug) && l.courseSlug === courseSlug)
    .sort((a, b) => {
      const modOrderA = moduleOrder.get(a.moduleSlug) ?? 0;
      const modOrderB = moduleOrder.get(b.moduleSlug) ?? 0;
      if (modOrderA !== modOrderB) return modOrderA - modOrderB;
      return a.order - b.order;
    });

  lessonsForCourseCache.set(courseSlug, result);
  return result;
}

// ── Module helpers ────────────────────────────────────────────────────────────

export function getAllModules(): Module[] {
  return [...modules].sort((a, b) => a.order - b.order);
}

export function getModuleBySlug(slug: string, courseSlug?: string): Module | undefined {
  // Module slugs are only unique within a course (e.g. `csharp` exists as both
  // a cheat-sheet module and a question-answers module), so an optional
  // `courseSlug` disambiguates. Without it, the first match is returned.
  if (courseSlug) {
    return modules.find((m) => m.slug === slug && m.courseSlug === courseSlug);
  }
  return modules.find((m) => m.slug === slug);
}

export function getCourseForModule(moduleSlug: string, courseSlug?: string): Course | undefined {
  const mod = getModuleBySlug(moduleSlug, courseSlug);
  if (!mod) return undefined;
  return courses.find((c) => c.slug === mod.courseSlug);
}

export function filterModulesByDifficulty(difficulty: Difficulty): Module[] {
  return modules.filter((m) => m.difficulty === difficulty);
}

// ── Lesson helpers ────────────────────────────────────────────────────────────

export function getAllLessons(): Lesson[] {
  return [...lessons].sort((a, b) => a.order - b.order);
}

const lessonsForModuleCache = new Map<string, Lesson[]>();

export function getLessonsForModule(moduleSlug: string, courseSlug?: string): Lesson[] {
  const key = `${courseSlug ?? ""} ${moduleSlug}`;
  const cached = lessonsForModuleCache.get(key);
  if (cached) return cached;
  const result = getLessonsByModule(moduleSlug, courseSlug);
  lessonsForModuleCache.set(key, result);
  return result;
}

// Lookup indexes: getLessonBySlug runs for every page render (metadata + page
// body + related-lesson links) and each call used to scan every lesson twice.
const lessonBySlugIndex = new Map<string, Lesson | undefined>();
// A lesson slug is unique within a module but NOT within a course (e.g.
// `maximum-subarray` exists in both the array and dynamic-programming problem
// modules), so the index is keyed by `courseSlug|moduleSlug|slug`.
const lessonByModuleAndSlugIndex = new Map<string, Lesson>();

function lessonKey(courseSlug: string, moduleSlug: string, slug: string): string {
  return `${courseSlug}|${moduleSlug}|${slug}`;
}

export function getLessonBySlug(
  slug: string,
  courseSlug?: string,
  moduleSlug?: string
): Lesson | undefined {
  if (courseSlug && moduleSlug) {
    const key = lessonKey(courseSlug, moduleSlug, slug);
    const cached = lessonByModuleAndSlugIndex.get(key);
    if (cached) return cached;
    for (const l of lessons) {
      if (l.courseSlug === courseSlug && l.moduleSlug === moduleSlug && l.slug === slug) {
        lessonByModuleAndSlugIndex.set(key, l);
        return l;
      }
    }
    return undefined;
  }

  if (courseSlug) {
    // Without a module, prefer the first lesson in course/module order so the
    // result is stable, then cache it under the module-qualified key too.
    const found =
      getLessonsForCourse(courseSlug).find((l) => l.slug === slug) ??
      lessons.find((l) => l.courseSlug === courseSlug && l.slug === slug);
    if (found)
      lessonByModuleAndSlugIndex.set(
        lessonKey(found.courseSlug, found.moduleSlug, found.slug),
        found
      );
    return found;
  }

  if (lessonBySlugIndex.has(slug)) return lessonBySlugIndex.get(slug);
  const found = lessons.find((l) => l.slug === slug);
  lessonBySlugIndex.set(slug, found);
  return found;
}

export function getAdjacentLessons(
  lesson: Lesson,
  courseSlug?: string
): { prev: Lesson | null; next: Lesson | null } {
  const orderedLessons = courseSlug
    ? getLessonsForCourse(courseSlug)
    : getAllModules().flatMap((m) => getLessonsByModule(m.slug));

  const idx = orderedLessons.findIndex((l) => l.slug === lesson.slug);

  if (idx === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: idx > 0 ? orderedLessons[idx - 1] : null,
    next: idx < orderedLessons.length - 1 ? orderedLessons[idx + 1] : null,
  };
}

/** Return full breadcrumb data for a lesson */
export function getLessonBreadcrumb(lesson: Lesson): {
  course: Course | undefined;
  module: Module | undefined;
  lesson: Lesson;
} {
  // Scope by the lesson's own course: a module slug can collide across courses
  // (e.g. `csharp`), so the bare slug would resolve to the wrong module.
  const mod = getModuleBySlug(lesson.moduleSlug, lesson.courseSlug);
  const course = mod ? getCourseBySlug(mod.courseSlug) : undefined;
  return { course, module: mod, lesson };
}

// ── Lesson payloads for client components ─────────────────────────────────────

/**
 * Returns a copy of a lesson without its `blocks` content.
 *
 * Client components (lesson sidebar, lesson cards, filters, action buttons)
 * only render lesson metadata, but every prop passed to a client component is
 * serialized into that page's RSC payload. Handing them full lessons means each
 * page of a course embeds the content of *every* lesson of that course — which
 * dominates build output size and render time. Use this helper at those call
 * sites; keep full `Lesson` objects only where `blocks` are actually rendered.
 */
export function toLessonNavItem(lesson: Lesson): LessonNavItem {
  const copy = { ...lesson };
  delete (copy as Partial<Lesson>).blocks;
  return copy as LessonNavItem;
}

/** Same as {@link toLessonNavItem}, for lists handed to client components. */
export function toLessonNavItems(list: Lesson[]): LessonNavItem[] {
  return list.map(toLessonNavItem);
}

// ── Table of Contents extraction ─────────────────────────────────────────────

export function extractTOC(blocks: ContentBlock[]): TocEntry[] {
  // Collect headings with their block index so the anchor computation matches
  // the heading renderer exactly (see `computeHeadingAnchors`).
  const headings: { index: number; block: { text?: string; anchor?: string } }[] = [];
  const levels: (2 | 3 | 4)[] = [];
  blocks.forEach((block, index) => {
    if (block.type !== "heading") return;
    const data = (block as { data?: { level: 2 | 3 | 4; text: string; anchor?: string } }).data;
    const level = data?.level ?? (block as { level?: 2 | 3 | 4 }).level;
    const text = data?.text ?? (block as { text?: string }).text;
    if (level && text) {
      headings.push({ index, block: { text, anchor: data?.anchor } });
      levels.push(level);
    }
  });

  const anchors = computeHeadingAnchors(headings);
  const entries: TocEntry[] = [];
  headings.forEach(({ index, block }, i) => {
    const anchor = anchors.get(index);
    if (!anchor || !block.text) return;
    entries.push({ anchor, text: block.text, level: levels[i] });
  });
  return entries;
}

// ── Full-text search ──────────────────────────────────────────────────────────

/**
 * Bounded Levenshtein edit distance.
 *
 * Search is run over ~2,800 lessons on every keystroke, so the distance matrix
 * is capped at a small radius: anything longer than `max` is reported as
 * `max + 1` and the DP loop exits early. That keeps typo tolerance ("sring" →
 * "string") cheap enough to run inline without an index.
 */
function levenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Only two rows are ever needed, so memory stays O(min(a, b)).
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    // Every remaining cell in this row already exceeds the budget.
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

/** Maximum edits allowed for a token to still count as a fuzzy match. */
function fuzzyTolerance(token: string): number {
  // Short tokens ("c#", "sql") would match far too much if we tolerated
  // edits, so only 4+ character tokens get fuzzy matching at all.
  if (token.length <= 3) return 0;
  if (token.length <= 5) return 1;
  return 2;
}

/** Whether `text` contains `token` as a whole word (cheaper than a regex). */
function containsWord(text: string, token: string): boolean {
  const idx = text.indexOf(token);
  if (idx === -1) return false;
  const before = idx === 0 ? "" : text[idx - 1];
  const after = idx + token.length >= text.length ? "" : text[idx + token.length];
  const isWordChar = (c: string) => /[a-z0-9]/.test(c);
  return !isWordChar(before) && !isWordChar(after);
}

/**
 * Scores one field against the query tokens.
 *
 * Ranking intent (highest first):
 *   exact field match > field starts with token > whole-word match >
 *   substring match > tag match > fuzzy (typo) match.
 * `fieldWeight` lets title matches outrank description/tag matches.
 */
function scoreField(
  text: string,
  tokens: string[],
  fieldWeight: number
): { score: number; matched: boolean } {
  const lower = text.toLowerCase();
  let score = 0;
  let matched = false;

  for (const token of tokens) {
    let tokenScore = 0;
    if (lower === token) tokenScore = 10;
    else if (lower.startsWith(token)) tokenScore = 6;
    else if (containsWord(lower, token)) tokenScore = 4;
    else if (lower.includes(token)) tokenScore = 2;

    if (tokenScore === 0) {
      // Fall back to typo tolerance against individual words.
      const tol = fuzzyTolerance(token);
      if (tol > 0) {
        for (const word of lower.split(/[^a-z0-9+#.]+/)) {
          if (!word) continue;
          if (levenshtein(word, token, tol) <= tol) {
            tokenScore = 1;
            break;
          }
        }
      }
    }

    if (tokenScore > 0) {
      matched = true;
      score += tokenScore * fieldWeight;
    }
  }

  return { score, matched };
}

/**
 * Builds a short excerpt of `description` centred on the first query token that
 * appears in it, so the UI can highlight the match without shipping the whole
 * description.
 */
function buildSnippet(description: string, tokens: string[]): string | undefined {
  if (!description) return undefined;
  const lower = description.toLowerCase();
  let matchIndex = -1;
  let matchLength = 0;

  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx !== -1) {
      matchIndex = idx;
      matchLength = token.length;
      break;
    }
  }

  if (matchIndex <= 40 && description.length <= 160) return description;

  const start = Math.max(0, matchIndex === -1 ? 0 : matchIndex - 40);
  const end = Math.min(description.length, start + 140);
  const snippet = description.slice(start, end).trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = end < description.length ? "…" : "";
  // Guard against `matchLength` being unused when there is no match.
  void matchLength;
  return `${prefix}${snippet}${suffix}`;
}

export function searchAll(query: string): SearchResult[] {
  // Tokenize so multi-word queries like "react hooks" match content tagged
  // `["react", "hooks"]` instead of requiring the literal substring.
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { result: SearchResult; score: number }[] = [];

  const push = (result: SearchResult, titleScore: number, descScore: number, tagScore: number) => {
    const score = titleScore + descScore + tagScore;
    if (score <= 0) return;
    // Title matches always outrank description/tag-only matches.
    const matchField: SearchResult["matchField"] =
      titleScore > 0 ? "title" : tagScore > 0 ? "tag" : "description";
    scored.push({
      result: {
        ...result,
        score,
        matchField,
        snippet:
          matchField === "description" ? buildSnippet(result.description, tokens) : undefined,
      },
      score,
    });
  };

  // Search lessons (weight 3 for titles so lessons surface above modules on a
  // title hit, then type bonuses below break ties).
  for (const lesson of lessons) {
    const title = scoreField(lesson.title, tokens, 3);
    const desc = scoreField(lesson.description, tokens, 1);
    const tag = scoreField((lesson.tags ?? []).join(" "), tokens, 2);
    push(
      {
        type: "lesson",
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description,
        courseSlug: lesson.courseSlug,
        moduleSlug: lesson.moduleSlug,
        difficulty: lesson.difficulty,
        tags: lesson.tags,
        technology: lesson.technology,
      },
      title.score,
      desc.score,
      tag.score
    );
  }

  // Search modules
  for (const mod of modules) {
    const title = scoreField(mod.title, tokens, 3);
    const desc = scoreField(mod.description, tokens, 1);
    const tag = scoreField((mod.tags ?? []).join(" "), tokens, 2);
    push(
      {
        type: "module",
        slug: mod.slug,
        title: mod.title,
        description: mod.description,
        courseSlug: mod.courseSlug,
        difficulty: mod.difficulty,
        tags: mod.tags,
      },
      title.score,
      desc.score,
      tag.score
    );
  }

  // Search courses
  for (const course of courses) {
    // The cheatsheet and question-answers "courses" have no cross-category
    // landing page; their individual cheat sheets and question topics are
    // surfaced as module results instead.
    if (course.slug === "cheatsheet" || course.slug === "question-answers") continue;
    const title = scoreField(course.title, tokens, 3);
    const desc = scoreField(course.description, tokens, 1);
    push(
      {
        type: "course",
        slug: course.slug,
        title: course.title,
        description: course.description,
      },
      title.score,
      desc.score,
      0
    );
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((s) => s.result);
}

// Course category / problem-slug lookups now live in `lib/content-hrefs.ts`
// (see the re-exports at the top of this file).

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getCourseStats() {
  // `lessons` includes every content tree (courses, problems, cheatsheets,
  // question answers), so each headline count is scoped to its own tree rather
  // than reporting overlapping totals.
  const courseLessons = getSubjectCourses().flatMap((c) => getLessonsForCourse(c.slug));
  const totalLessons = courseLessons.length;
  const totalModules = getSubjectCourses().reduce(
    (sum, c) => sum + getModulesForCourse(c.slug).length,
    0
  );
  const totalMinutes = courseLessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const totalProblems = getProblemCourses().reduce(
    (sum, c) => sum + getLessonsForCourse(c.slug).length,
    0
  );
  const totalQuestions = lessons.filter((l) => l.courseSlug === "question-answers").length;
  const totalCheatsheets = getCheatsheetModules().length;

  return {
    totalLessons,
    totalModules,
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60),
    totalProblems,
    totalQuestions,
    totalCheatsheets,
  };
}

// ── Question answer helpers ───────────────────────────────────────────────────

/**
 * Question answers live in `content/<category>/question-answers/<technology>/`,
 * where each technology directory is a module of the single `question-answers`
 * pseudo-course (mirroring how cheat sheets are organised).
 */
export interface QuestionTechnology {
  /** Module slug — identical to the URL technology segment. */
  slug: string;
  title: string;
  description: string;
  icon: string;
  /** Content category the technology belongs to (e.g. "backend"). */
  category: string;
  difficulty: Difficulty;
  estimatedHours: number;
  order: number;
  questionCount: number;
}

const questionModulesCache = memoizeNoArg(() =>
  modules.filter((m) => m.courseSlug === "question-answers")
);

/** Sorts category keys by the canonical category order, then alphabetically. */
function sortCategoryKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b));
}

/** Position of a category in the canonical category order (unknown → last). */
function categoryRank(category: string): number {
  const idx = CATEGORY_ORDER.indexOf(category);
  return idx === -1 ? 99 : idx;
}

/** Every content category that hosts question answers. */
export function getQuestionCategories(): string[] {
  const categories = new Set<string>();
  for (const mod of questionModulesCache()) {
    const category = getQuestionTechCategory(mod.slug);
    if (category) categories.add(category);
  }
  return sortCategoryKeys([...categories]);
}

/**
 * Every question-answer technology, optionally narrowed to a single category.
 * Within a category the technologies are ordered by their module `order`.
 */
export function getQuestionTechnologies(category?: string): QuestionTechnology[] {
  const result = questionModulesCache()
    .filter((mod) => !category || getQuestionTechCategory(mod.slug) === category)
    .map((mod) => ({
      slug: mod.slug,
      title: mod.title,
      description: mod.description,
      icon: mod.icon,
      category: getQuestionTechCategory(mod.slug) ?? "",
      difficulty: mod.difficulty,
      estimatedHours: mod.estimatedHours,
      order: mod.order,
      questionCount: getLessonsForModule(mod.slug, "question-answers").length,
    }));

  if (category) {
    return result.sort((a, b) => a.order - b.order);
  }
  return result.sort(
    (a, b) => categoryRank(a.category) - categoryRank(b.category) || a.order - b.order
  );
}

/** Question answers for a technology, ordered by difficulty then position. */
export function getQuestionAnswers(technology: string, category?: string): Lesson[] {
  return lessons
    .filter((l) => l.courseSlug === "question-answers" && l.moduleSlug === technology)
    .filter((l) => !category || getQuestionTechCategory(l.moduleSlug) === category)
    .sort((a, b) => {
      return (a.order || 0) - (b.order || 0);
    });
}

export function getQuestionAnswerCount(technology: string, category?: string): number {
  return getQuestionAnswers(technology, category).length;
}

/** Question answers of a technology grouped by difficulty level. */
export function getQuestionAnswersByDifficulty(
  technology: string,
  category?: string
): { difficulty: Difficulty; questions: Lesson[] }[] {
  const questions = getQuestionAnswers(technology, category);
  const groups: { difficulty: Difficulty; questions: Lesson[] }[] = [];

  for (const difficulty of DIFFICULTY_ORDER) {
    const matching = questions.filter((q) => q.difficulty === difficulty);
    if (matching.length > 0) groups.push({ difficulty, questions: matching });
  }

  return groups;
}

// ── Glossary helpers ───────────────────────────────────────────────────────────

export function getAllGlossaryTerms(): GlossaryTerm[] {
  return [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term));
}

export function getGlossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}

export function getGlossaryTermsByCategory(category: string): GlossaryTerm[] {
  return glossaryTerms.filter((t) => t.category === category);
}

// ── Prompt helpers ────────────────────────────────────────────────────────────

export function getAllPromptTemplates(): PromptTemplate[] {
  return [...promptTemplates].sort((a, b) => a.title.localeCompare(b.title));
}

export function getPromptTemplateBySlug(slug: string): PromptTemplate | undefined {
  return promptTemplates.find((p) => p.slug === slug);
}

export function getPromptsByCategory(category: string): PromptTemplate[] {
  return promptTemplates.filter((p) => p.category === category);
}
