#!/usr/bin/env node

/**
 * Auto-generates content index files for courses, modules, and lessons.
 * Scans the category-first content tree and regenerates:
 *   - content/courses.ts
 *   - content/modules.ts
 *   - content/lessons.ts
 *   - content/categories.ts
 *   - content/roadmaps.ts
 *
 * Layout:
 *   content/<category>/courses/<courseSlug>/...
 *   content/<category>/problems/<courseSlug>/...
 *   content/<category>/cheatsheet/<technology>/...
 *   content/<category>/question-answers/<technology>/...
 *   content/<category>/roadmaps/roadmap.json   (curated learning path)
 *   content/cheatsheet.json             (cheatsheet section metadata)
 *   content/question-answers.json       (question-answers section metadata)
 *
 * Run automatically before dev/build so new JSON files are picked up without manual edits.
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd());
const CONTENT_DIR = path.join(ROOT, "content");

const COURSES_INDEX = path.join(CONTENT_DIR, "courses.ts");
const MODULES_INDEX = path.join(CONTENT_DIR, "modules.ts");
const LESSONS_INDEX = path.join(CONTENT_DIR, "lessons.ts");
const CATEGORIES_INDEX = path.join(CONTENT_DIR, "categories.ts");
const ROADMAPS_INDEX = path.join(CONTENT_DIR, "roadmaps.ts");

/** Section directories that make a top-level directory a content category. */
const SECTION_DIRS = ["courses", "problems", "cheatsheet", "question-answers"] as const;

interface CourseInfo {
  importPath: string;
  variableName: string;
  slug: string;
  category: string;
}

interface ModuleInfo {
  importPath: string;
  variableName: string;
  slug: string;
  courseSlug: string;
  category: string;
}

interface LessonInfo {
  importPath: string;
  variableName: string;
  slug: string;
  courseSlug: string;
  moduleSlug: string;
}

function toVariableName(slug: string, prefix: string): string {
  const cleaned = slug
    .replace(/[^a-z0-9]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ""))
    .replace(/^[0-9]/, (m) => `${prefix}${m}`);
  return `${prefix}${cleaned}`;
}

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listDirs(p: string): string[] {
  try {
    return (
      fs
        .readdirSync(p)
        .filter((entry) => isDirectory(path.join(p, entry)))
        // Sort for deterministic output: `readdirSync` order is filesystem-
        // dependent, which previously made the generated index files churn.
        .sort()
    );
  } catch {
    return [];
  }
}

/**
 * Categories are the top-level directories that contain at least one of the
 * known section directories (courses / problems / cheatsheet). This keeps the
 * category list in sync with whatever content actually exists on disk.
 */
function findCategories(): string[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((entry) => isDirectory(path.join(CONTENT_DIR, entry)))
    .filter((entry) =>
      SECTION_DIRS.some((section) => isDirectory(path.join(CONTENT_DIR, entry, section)))
    )
    .sort();
}

function uniqueVariableName(base: string, prefix: string, usedNames: Set<string>): string {
  let variableName = base;
  if (!/^[a-zA-Z]/.test(variableName)) {
    variableName = `${prefix}${variableName}`;
  }
  if (usedNames.has(variableName)) {
    let counter = 1;
    while (usedNames.has(`${variableName}${counter}`)) counter++;
    variableName = `${variableName}${counter}`;
  }
  usedNames.add(variableName);
  return variableName;
}

function scanCourses(): CourseInfo[] {
  const courses: CourseInfo[] = [];
  const usedNames = new Set<string>();

  const addCourse = (slug: string, category: string, importPath: string) => {
    const variableName = uniqueVariableName(
      `${toVariableName(slug, "")}Course`,
      "course",
      usedNames
    );
    courses.push({ importPath, variableName, slug, category });
  };

  for (const category of findCategories()) {
    for (const section of ["courses", "problems"] as const) {
      const sectionDir = path.join(CONTENT_DIR, category, section);
      for (const entry of listDirs(sectionDir)) {
        if (!fs.existsSync(path.join(sectionDir, entry, "content.json"))) continue;
        addCourse(entry, category, `./${category}/${section}/${entry}/content.json`);
      }
    }
  }

  // Section-level pseudo-courses (not part of a single category).
  if (fs.existsSync(path.join(CONTENT_DIR, "cheatsheet.json"))) {
    addCourse("cheatsheet", "cheatsheet", "./cheatsheet.json");
  }
  if (fs.existsSync(path.join(CONTENT_DIR, "question-answers.json"))) {
    addCourse("question-answers", "question-answers", "./question-answers.json");
  }

  return courses.sort((a, b) => a.slug.localeCompare(b.slug));
}

function scanModules(): ModuleInfo[] {
  const modules: ModuleInfo[] = [];
  const usedNames = new Set<string>();

  const walk = (dir: string, category: string) => {
    for (const entry of fs.readdirSync(dir).sort()) {
      const fullPath = path.join(dir, entry);
      if (!isDirectory(fullPath)) continue;

      const contentJsonPath = path.join(fullPath, "content.json");
      if (fs.existsSync(contentJsonPath)) {
        const relativePath = path.relative(CONTENT_DIR, fullPath).replace(/\\/g, "/");
        const importPath = `./${relativePath}/content.json`;
        const slug = entry;
        const variableName = uniqueVariableName(
          `${toVariableName(slug, "")}Module`,
          "mod",
          usedNames
        );

        let courseSlug = "";
        try {
          const data = JSON.parse(fs.readFileSync(contentJsonPath, "utf8"));
          courseSlug = data.courseSlug || "";
        } catch {
          // ignore malformed JSON — typecheck/tests will surface it
        }

        modules.push({ importPath, variableName, slug, courseSlug, category });
      }

      walk(fullPath, category);
    }
  };

  for (const category of findCategories()) {
    for (const section of SECTION_DIRS) {
      const sectionDir = path.join(CONTENT_DIR, category, section);
      if (isDirectory(sectionDir)) walk(sectionDir, category);
    }
  }

  return modules.sort((a, b) => a.slug.localeCompare(b.slug));
}

function scanLessons(): LessonInfo[] {
  const lessons: LessonInfo[] = [];
  const usedNames = new Set<string>();

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir).sort()) {
      const fullPath = path.join(dir, entry);
      if (isDirectory(fullPath)) {
        walk(fullPath);
      } else if (entry.endsWith(".json") && entry !== "content.json") {
        const relativePath = path.relative(CONTENT_DIR, fullPath).replace(/\\/g, "/");
        const importPath = `./${relativePath}`;
        const slug = entry.replace(".json", "");
        const variableName = uniqueVariableName(
          `${toVariableName(slug, "")}Lesson`,
          "lesson",
          usedNames
        );

        let courseSlug = "";
        let moduleSlug = "";
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
          courseSlug = data.courseSlug || "";
          moduleSlug = data.moduleSlug || "";
        } catch {
          // ignore malformed JSON
        }

        lessons.push({ importPath, variableName, slug, courseSlug, moduleSlug });
      }
    }
  };

  for (const category of findCategories()) {
    for (const section of SECTION_DIRS) {
      const sectionDir = path.join(CONTENT_DIR, category, section);
      if (isDirectory(sectionDir)) walk(sectionDir);
    }
  }

  return lessons.sort((a, b) => a.slug.localeCompare(b.slug));
}

function generateCoursesIndex(courses: CourseInfo[]): string {
  const CHUNK_SIZE = 500;
  const chunks: CourseInfo[][] = [];
  for (let i = 0; i < courses.length; i += CHUNK_SIZE) {
    chunks.push(courses.slice(i, i + CHUNK_SIZE));
  }

  const imports = courses.map((c) => `import ${c.variableName} from "${c.importPath}";`).join("\n");

  const buildParts = (kind: "Courses") => {
    const partDecls = chunks
      .map((chunk, idx) => {
        const exports = chunk
          .map((c) => `\t{ ...${c.variableName}, urlCategory: "${c.category}" },`)
          .join("\n");
        return `const raw${kind}Part${idx + 1} = [\n${exports}\n];`;
      })
      .join("\n\n");
    const partRefs = chunks.map((_, idx) => `...raw${kind}Part${idx + 1}`).join(", ");
    return { partDecls, combineDecl: `const raw${kind}: any[] = [${partRefs}];` };
  };

  const { partDecls, combineDecl } = buildParts("Courses");

  return `import type { Course } from "@/types";

${imports}

${partDecls}

${combineDecl}

export const courses: Course[] = rawCourses as unknown as Course[];

export function getCourseBySlug(slug: string): Course | undefined {
\treturn courses.find((c) => c.slug === slug);
}
`;
}

function generateModulesIndex(modules: ModuleInfo[]): string {
  const CHUNK_SIZE = 500;
  const chunks: ModuleInfo[][] = [];
  for (let i = 0; i < modules.length; i += CHUNK_SIZE) {
    chunks.push(modules.slice(i, i + CHUNK_SIZE));
  }

  const imports = modules.map((m) => `import ${m.variableName} from "${m.importPath}";`).join("\n");

  const partDecls = chunks
    .map((chunk, idx) => {
      const exports = chunk
        .map((m) => `\t{ ...${m.variableName}, urlCategory: "${m.category}" },`)
        .join("\n");
      return `const rawModulesPart${idx + 1} = [\n${exports}\n];`;
    })
    .join("\n\n");
  const partRefs = chunks.map((_, idx) => `...rawModulesPart${idx + 1}`).join(", ");
  const combineDecl = `const rawModules: any[] = [${partRefs}];`;

  return `import type { Module } from "@/types";

${imports}

${partDecls}

${combineDecl}

export const modules: Module[] = rawModules as unknown as Module[];

export function getModuleBySlug(slug: string, courseSlug?: string): Module | undefined {
\tif (courseSlug) return modules.find((m) => m.slug === slug && m.courseSlug === courseSlug);
\treturn modules.find((m) => m.slug === slug);
}

export function getModulesByCourse(courseSlug: string): Module[] {
\treturn modules.filter((m) => m.courseSlug === courseSlug).sort((a, b) => a.order - b.order);
}
`;
}

// ── Category index ─────────────────────────────────────────────────────────────

interface CategoryInfo {
  /** slug → URL category (courses, problem courses, cheatsheet technologies). */
  categoryBySlug: Map<string, string>;
  /** Slugs of every course that lives under a `problems/` directory. */
  problemCourseSlugs: string[];
  /** Question-answer technology slug → URL category. */
  questionTechCategory: Map<string, string>;
  /** Question-answer lesson slug → owning technology slug. */
  questionLessonTech: Map<string, string>;
}

/**
 * Categories come from the directory structure, so they are derived the same
 * way the courses index derives `urlCategory` — but into a *separate*, tiny
 * file. `lib/content-hrefs.ts` imports this to build links from client
 * components without dragging every lesson JSON into the browser bundle.
 */
function scanCategories(): CategoryInfo {
  const categoryBySlug = new Map<string, string>();
  const problemCourseSlugs: string[] = [];
  const questionTechCategory = new Map<string, string>();
  const questionLessonTech = new Map<string, string>();

  // A course's `content.json` slug can differ from its directory name (e.g.
  // `problems/csharp/content.json` has slug `csharp-problems`), and runtime
  // lookups key off the JSON slug, so always read it.
  const readCourseSlug = (contentJsonPath: string, fallback: string): string => {
    try {
      const parsed = JSON.parse(fs.readFileSync(contentJsonPath, "utf8")) as { slug?: unknown };
      return typeof parsed.slug === "string" && parsed.slug.length > 0 ? parsed.slug : fallback;
    } catch {
      return fallback;
    }
  };

  for (const category of findCategories()) {
    for (const section of ["courses", "problems"] as const) {
      const sectionDir = path.join(CONTENT_DIR, category, section);
      for (const entry of listDirs(sectionDir)) {
        const contentJsonPath = path.join(sectionDir, entry, "content.json");
        if (!fs.existsSync(contentJsonPath)) continue;
        const slug = readCourseSlug(contentJsonPath, entry);
        // Courses win over cheatsheet technologies if slugs ever collide.
        categoryBySlug.set(slug, category);
        if (section === "problems") problemCourseSlugs.push(slug);
      }
    }

    // Cheatsheet "modules" are one technology directory each; their hrefs
    // resolve the category from the technology (module) slug.
    const cheatsheetDir = path.join(CONTENT_DIR, category, "cheatsheet");
    for (const entry of listDirs(cheatsheetDir)) {
      if (!fs.existsSync(path.join(cheatsheetDir, entry, "content.json"))) continue;
      if (!categoryBySlug.has(entry)) categoryBySlug.set(entry, category);
    }

    // Question answers are one technology module per directory. The module
    // slug *is* the technology slug, so it resolves both the category and the
    // owning technology of every question inside it.
    const questionDir = path.join(CONTENT_DIR, category, "question-answers");
    for (const entry of listDirs(questionDir)) {
      const moduleJsonPath = path.join(questionDir, entry, "content.json");
      if (!fs.existsSync(moduleJsonPath)) continue;
      const slug = readCourseSlug(moduleJsonPath, entry);
      questionTechCategory.set(slug, category);
      try {
        const parsed = JSON.parse(fs.readFileSync(moduleJsonPath, "utf8")) as {
          lessonSlugs?: unknown;
        };
        if (Array.isArray(parsed.lessonSlugs)) {
          for (const lessonSlug of parsed.lessonSlugs) {
            if (typeof lessonSlug === "string") questionLessonTech.set(lessonSlug, slug);
          }
        }
      } catch {
        // ignore malformed JSON
      }
    }
  }

  return {
    categoryBySlug,
    problemCourseSlugs: problemCourseSlugs.sort(),
    questionTechCategory,
    questionLessonTech,
  };
}

function generateCategoriesIndex({
  categoryBySlug,
  problemCourseSlugs,
  questionTechCategory,
  questionLessonTech,
}: CategoryInfo): string {
  const categoryEntries = Array.from(categoryBySlug.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const categoryLines = categoryEntries
    .map(([slug, category]) => `\t${JSON.stringify(slug)}: ${JSON.stringify(category)},`)
    .join("\n");
  const problemLines = problemCourseSlugs.map((slug) => `\t${JSON.stringify(slug)},`).join("\n");
  const questionTechLines = Array.from(questionTechCategory.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, category]) => `\t${JSON.stringify(slug)}: ${JSON.stringify(category)},`)
    .join("\n");
  const questionLessonLines = Array.from(questionLessonTech.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, tech]) => `\t${JSON.stringify(slug)}: ${JSON.stringify(tech)},`)
    .join("\n");

  return `/**
 * Auto-generated by \`yarn generate:content\` - do not edit by hand.
 *
 * Compact slug -> URL category lookup for \`lib/content-hrefs.ts\`.
 * Kept out of \`content/courses.ts\` so client components can build hrefs
 * without importing the full content graph into the browser bundle.
 */

export const COURSE_URL_CATEGORY: Record<string, string> = {
${categoryLines}
};

export const PROBLEM_COURSE_SLUGS: string[] = [
${problemLines}
];

/** Question-answer technology (module) slug -> URL category. */
export const QUESTION_TECH_CATEGORY: Record<string, string> = {
${questionTechLines}
};

/** Question-answer lesson slug -> owning technology (module) slug. */
export const QUESTION_LESSON_TECH: Record<string, string> = {
${questionLessonLines}
};
`;
}

function generateLessonsIndex(lessons: LessonInfo[]): string {
  const CHUNK_SIZE = 500;
  const chunks: LessonInfo[][] = [];
  for (let i = 0; i < lessons.length; i += CHUNK_SIZE) {
    chunks.push(lessons.slice(i, i + CHUNK_SIZE));
  }

  const imports = lessons.map((l) => `import ${l.variableName} from "${l.importPath}";`).join("\n");

  const partDecls = chunks
    .map((chunk, idx) => {
      const exports = chunk.map((l) => `\t${l.variableName},`).join("\n");
      return `const rawLessonsPart${idx + 1} = [\n${exports}\n];`;
    })
    .join("\n\n");
  const partRefs = chunks.map((_, idx) => `...rawLessonsPart${idx + 1}`).join(", ");
  const combineDecl = `const rawLessons: any[] = [${partRefs}];`;

  return `import type { Lesson } from '@/types';

${imports}

${partDecls}

${combineDecl}

export const lessons: Lesson[] = rawLessons as unknown as Lesson[];

export function getLessonBySlug(slug: string): Lesson | undefined {
\treturn lessons.find((l) => l.slug === slug);
}

export function getLessonsByModule(moduleSlug: string, courseSlug?: string): Lesson[] {
\treturn lessons
\t\t.filter((l) => l.moduleSlug === moduleSlug && (!courseSlug || l.courseSlug === courseSlug))
\t\t.sort((a, b) => a.order - b.order);
}
`;
}

// ── Roadmap index ─────────────────────────────────────────────────────────────

interface RoadmapInfo {
  importPath: string;
  variableName: string;
  category: string;
}

/**
 * Roadmaps live at `content/<category>/roadmaps/roadmap.json` — one curated
 * learning path per category, served at `/<category>/roadmap`.
 */
function scanRoadmaps(): RoadmapInfo[] {
  const roadmaps: RoadmapInfo[] = [];
  const usedNames = new Set<string>();

  for (const category of findCategories()) {
    const roadmapPath = path.join(CONTENT_DIR, category, "roadmaps", "roadmap.json");
    if (!fs.existsSync(roadmapPath)) continue;
    roadmaps.push({
      importPath: `./${category}/roadmaps/roadmap.json`,
      variableName: uniqueVariableName(
        `${toVariableName(category, "")}Roadmap`,
        "roadmap",
        usedNames
      ),
      category,
    });
  }

  return roadmaps.sort((a, b) => a.category.localeCompare(b.category));
}

function generateRoadmapsIndex(roadmaps: RoadmapInfo[]): string {
  const imports = roadmaps
    .map((r) => `import ${r.variableName} from "${r.importPath}";`)
    .join("\n");

  const exports = roadmaps
    .map((r) => `\t{ ...${r.variableName}, category: "${r.category}", slug: "roadmap" },`)
    .join("\n");

  return `import type { Roadmap } from "@/types";

${imports}

export const roadmaps: Roadmap[] = [
${exports}
] as unknown as Roadmap[];

export function getRoadmapByCategory(category: string): Roadmap | undefined {
\treturn roadmaps.find((r) => r.category === category);
}
`;
}

/**
 * Writes content only when it changes, so we don't touch mtimes (and bust the
 * webpack cache) when nothing changed.
 */
function writeIfChanged(filePath: string, content: string): boolean {
  try {
    if (fs.readFileSync(filePath, "utf8") === content) {
      return false;
    }
  } catch {
    // File does not exist yet — fall through and write it.
  }
  fs.writeFileSync(filePath, content);
  return true;
}

function main() {
  console.log("Scanning content directories...");

  const courses = scanCourses();
  const modules = scanModules();
  const lessons = scanLessons();
  const categories = scanCategories();
  const roadmaps = scanRoadmaps();

  console.log(
    `Found ${courses.length} courses, ${modules.length} modules, ${lessons.length} lessons, ${roadmaps.length} roadmaps`
  );

  writeIfChanged(COURSES_INDEX, generateCoursesIndex(courses));
  writeIfChanged(MODULES_INDEX, generateModulesIndex(modules));
  writeIfChanged(LESSONS_INDEX, generateLessonsIndex(lessons));
  writeIfChanged(CATEGORIES_INDEX, generateCategoriesIndex(categories));
  writeIfChanged(ROADMAPS_INDEX, generateRoadmapsIndex(roadmaps));

  console.log(
    "Updated content/courses.ts, content/modules.ts, content/lessons.ts, content/categories.ts, content/roadmaps.ts"
  );
}

main();
