import {
  searchAll,
  getCourseStats,
  getAllCourses,
  getProblemCourses,
  getLessonsForCourse,
  getAllModules,
  getAllLessons,
  getCourseCategory,
  getContentItemHref,
  isProblemCourseSlug,
  getQuestionCategories,
  getQuestionTechnologies,
} from "@/lib/content";
import type { Module, Lesson } from "@/types";
import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content");

const MODULE_FIELDS = new Set([
  "id",
  "slug",
  "courseSlug",
  "title",
  "description",
  "longDescription",
  "order",
  "difficulty",
  "estimatedHours",
  "icon",
  "tags",
  "lessonSlugs",
  "isOptional",
  "skipLabel",
  "prerequisites",
  "whatYouLearn",
]);
const LESSON_FIELDS = new Set([
  "id",
  "slug",
  "moduleSlug",
  "courseSlug",
  "title",
  "description",
  "order",
  "difficulty",
  "estimatedMinutes",
  "tags",
  "blocks",
  "technology",
  "relatedLessons",
  "relatedGlossaryTerms",
  "furtherReading",
  "prerequisites",
]);

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
  }
}

function isJSONFile(filePath: string): boolean {
  return filePath.endsWith(".json");
}

/**
 * Path segments relative to `content/`.
 *
 * Current layout is category-first, e.g.
 * `content/[category]/courses/[courseSlug]/[moduleSlug]/[lessonSlug].json`
 * or `content/[category]/problems/[courseSlug]/...`.
 */
function getRelativeParts(filePath: string): string[] {
  return path.relative(contentDir, filePath).split(path.sep);
}

function getCourseSlugFromPath(filePath: string): string | null {
  const parts = getRelativeParts(filePath);

  // Category-first courses/problems: parts[0] is the category, parts[1] is the
  // section, parts[2] is the course directory (which doubles as the lookup key).
  // Non-category trees (content/ai/glossary, content/ai/prompts,
  // content/ai/roadmaps, content/ai/advanced) and root files
  // (content/cheatsheet.json) fall through to null.
  if (parts.length >= 3 && (parts[1] === "courses" || parts[1] === "problems")) {
    return parts[2];
  }

  // Every cheat sheet belongs to the single virtual "cheatsheet" course.
  if (parts.length >= 2 && parts[1] === "cheatsheet") {
    return "cheatsheet";
  }

  // Every question answer belongs to the single virtual "question-answers" course.
  if (parts.length >= 2 && parts[1] === "question-answers") {
    return "question-answers";
  }

  return null;
}

/** Raw shape of a content JSON file — only the fields the validator inspects. */
interface RawContentJson {
  [key: string]: unknown;
  moduleSlugs?: unknown;
  lessonSlugs?: unknown;
  relatedLessons?: unknown;
}

/**
 * A `content.json` is module metadata when it sits directly between a course
 * (or cheatsheet / question-answer technology) and its lesson files:
 *   [category]/courses|[problems]/[courseSlug]/[moduleSlug]/content.json
 *   [category]/cheatsheet/[technology]/content.json
 *   [category]/question-answers/[technology]/content.json
 *
 * Course metadata files live one level higher and are not field-checked.
 */
function isModuleContentFile(parts: string[], data: RawContentJson): boolean {
  const structuralModule =
    (parts.length === 5 && (parts[1] === "courses" || parts[1] === "problems")) ||
    (parts.length === 4 && (parts[1] === "cheatsheet" || parts[1] === "question-answers"));

  // Some content nests a whole course inside a course directory. Those files
  // declare `moduleSlugs`, so they are course metadata rather than module
  // metadata (matching the pre-restructure behaviour of skipping them).
  return structuralModule && !Array.isArray(data.moduleSlugs);
}

function listDirectories(dir: string): string[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  return fs
    .readdirSync(dir)
    .map((entry) => path.join(dir, entry))
    .filter((entryPath) => fs.statSync(entryPath).isDirectory());
}

interface CourseDirectory {
  path: string;
  slug: string;
}

/** All category-first course directories: [category]/courses|[problems]/[courseSlug]. */
function findCourseDirectories(): CourseDirectory[] {
  const courses: CourseDirectory[] = [];
  for (const categoryPath of listDirectories(contentDir)) {
    for (const section of ["courses", "problems"]) {
      for (const coursePath of listDirectories(path.join(categoryPath, section))) {
        courses.push({ path: coursePath, slug: path.basename(coursePath) });
      }
    }
  }
  return courses;
}

/** All [category]/cheatsheet directories. Each technology inside is a module. */
function findCheatsheetDirectories(): string[] {
  const dirs: string[] = [];
  for (const categoryPath of listDirectories(contentDir)) {
    const cheatsheetPath = path.join(categoryPath, "cheatsheet");
    if (fs.existsSync(cheatsheetPath) && fs.statSync(cheatsheetPath).isDirectory()) {
      dirs.push(cheatsheetPath);
    }
  }
  return dirs;
}

/** All [category]/question-answers directories. Each technology inside is a module. */
function findQuestionAnswerDirectories(): string[] {
  const dirs: string[] = [];
  for (const categoryPath of listDirectories(contentDir)) {
    const questionAnswerPath = path.join(categoryPath, "question-answers");
    if (fs.existsSync(questionAnswerPath) && fs.statSync(questionAnswerPath).isDirectory()) {
      dirs.push(questionAnswerPath);
    }
  }
  return dirs;
}

function validateContentFiles() {
  console.log("Validating content schema...\n");

  const validLessonSlugs = new Map<string, Set<string>>();
  const validModuleSlugs = new Map<string, Set<string>>();

  function ensureCourseMap(map: Map<string, Set<string>>, courseSlug: string) {
    if (!map.has(courseSlug)) map.set(courseSlug, new Set());
  }

  /**
   * Registers the module and lesson file names of one course-like tree.
   * For courses/problems the children are modules; for cheatsheets the
   * children are technology modules (all under the "cheatsheet" course).
   */
  function scanContentSection(sectionPath: string, courseSlug: string) {
    ensureCourseMap(validLessonSlugs, courseSlug);
    ensureCourseMap(validModuleSlugs, courseSlug);
    if (!fs.existsSync(sectionPath) || !fs.statSync(sectionPath).isDirectory()) return;
    for (const mod of fs.readdirSync(sectionPath)) {
      const modPath = path.join(sectionPath, mod);
      if (!fs.statSync(modPath).isDirectory()) continue;
      validModuleSlugs.get(courseSlug)!.add(mod);
      for (const file of fs.readdirSync(modPath)) {
        if (file.endsWith(".json") && file !== "content.json") {
          validLessonSlugs.get(courseSlug)!.add(file.replace(".json", ""));
        }
      }
    }
  }

  const courseDirectories = findCourseDirectories();
  const cheatsheetDirectories = findCheatsheetDirectories();
  const questionAnswerDirectories = findQuestionAnswerDirectories();

  for (const course of courseDirectories) {
    scanContentSection(course.path, course.slug);
  }
  for (const cheatsheetDir of cheatsheetDirectories) {
    scanContentSection(cheatsheetDir, "cheatsheet");
  }
  for (const questionAnswerDir of questionAnswerDirectories) {
    scanContentSection(questionAnswerDir, "question-answers");
  }

  let moduleSchemaErrors = 0;
  let lessonSchemaErrors = 0;
  let brokenRelatedLessons = 0;
  let missingLessonRefs = 0;

  function validateFile(filePath: string) {
    if (!isJSONFile(filePath)) return;
    try {
      const data: RawContentJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const courseSlug = getCourseSlugFromPath(filePath);
      const fileName = path.basename(filePath);
      const parts = getRelativeParts(filePath);

      if (fileName === "content.json") {
        if (isModuleContentFile(parts, data)) {
          for (const key of Object.keys(data)) {
            if (!MODULE_FIELDS.has(key)) {
              console.error(`  Invalid module field: ${key} in ${filePath}`);
              moduleSchemaErrors++;
            }
          }
          if (Array.isArray(data.lessonSlugs) && courseSlug) {
            const lessonSlugs: unknown[] = data.lessonSlugs;
            const valid = validLessonSlugs.get(courseSlug) || new Set<string>();
            for (const slug of lessonSlugs) {
              if (typeof slug !== "string") continue;
              if (!valid.has(slug)) {
                console.error(`  Missing lesson ref: ${filePath} -> ${slug}`);
                missingLessonRefs++;
              }
            }
          }
        }
      } else {
        for (const key of Object.keys(data)) {
          if (!LESSON_FIELDS.has(key)) {
            console.error(`  Invalid lesson field: ${key} in ${filePath}`);
            lessonSchemaErrors++;
          }
        }
        if (Array.isArray(data.relatedLessons) && courseSlug) {
          const relatedLessons: unknown[] = data.relatedLessons;
          const valid = validLessonSlugs.get(courseSlug) || new Set<string>();
          for (const slug of relatedLessons) {
            if (typeof slug !== "string") continue;
            if (!valid.has(slug)) {
              console.error(`  Broken relatedLessons: ${filePath} -> ${slug}`);
              brokenRelatedLessons++;
            }
          }
        }
      }
    } catch {
      console.error(`  Invalid JSON: ${filePath}`);
    }
  }

  function walkDir(dir: string) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath);
      } else if (isJSONFile(entry)) {
        validateFile(fullPath);
      }
    }
  }

  for (const course of courseDirectories) {
    walkDir(course.path);
  }
  for (const cheatsheetDir of cheatsheetDirectories) {
    walkDir(cheatsheetDir);
  }
  for (const questionAnswerDir of questionAnswerDirectories) {
    walkDir(questionAnswerDir);
  }

  assert(moduleSchemaErrors === 0, `Module schema violations: ${moduleSchemaErrors} (expected 0)`);
  assert(lessonSchemaErrors === 0, `Lesson schema violations: ${lessonSchemaErrors} (expected 0)`);
  assert(
    brokenRelatedLessons === 0,
    `Broken relatedLessons references: ${brokenRelatedLessons} (expected 0)`
  );
  assert(
    missingLessonRefs === 0,
    `Missing lesson file references: ${missingLessonRefs} (expected 0)`
  );
}

console.log("Running content helper tests...\n");

validateContentFiles();

// Test searchAll
const searchResults = searchAll("two sum");
assert(Array.isArray(searchResults), "searchAll returns an array");
assert(
  searchResults.some((r) => r.title.toLowerCase().includes("two sum")),
  'searchAll finds "two sum"'
);

// Test getCourseStats
const stats = getCourseStats();
assert(
  typeof stats.totalLessons === "number" && stats.totalLessons > 0,
  "getCourseStats returns totalLessons > 0"
);
assert(
  typeof stats.totalModules === "number" && stats.totalModules > 0,
  "getCourseStats returns totalModules > 0"
);
assert(
  typeof stats.totalMinutes === "number" && stats.totalMinutes > 0,
  "getCourseStats returns totalMinutes > 0"
);
assert(
  typeof stats.totalHours === "number" && stats.totalHours > 0,
  "getCourseStats returns totalHours > 0"
);

// Test getAllCourses
const allCourses = getAllCourses();
assert(Array.isArray(allCourses), "getAllCourses returns an array");
assert(allCourses.length > 0, "getAllCourses returns at least one course");

// Test getAllModules / getAllLessons
const allModules: Module[] = getAllModules();
assert(Array.isArray(allModules), "getAllModules returns an array");
assert(allModules.length > 0, "getAllModules returns at least one module");

const allLessons: Lesson[] = getAllLessons();
assert(Array.isArray(allLessons), "getAllLessons returns an array");
assert(allLessons.length > 0, "getAllLessons returns at least one lesson");

// Test getProblemCourses
const problemCourses = getProblemCourses();
assert(Array.isArray(problemCourses), "getProblemCourses returns an array");
assert(
  problemCourses.some((c) => c.slug === "csharp-problems"),
  "getProblemCourses includes csharp-problems"
);
assert(
  problemCourses.some((c) => c.slug === "sql-problems"),
  "getProblemCourses includes sql-problems"
);
assert(
  problemCourses.some((c) => c.slug === "system-design"),
  "getProblemCourses includes system-design"
);
assert(
  problemCourses.some((c) => c.slug === "azure-problems"),
  "getProblemCourses includes azure-problems"
);
assert(
  problemCourses.some((c) => c.slug === "lld-problems"),
  "getProblemCourses includes lld-problems"
);
assert(
  problemCourses.some((c) => c.slug === "hld-problems"),
  "getProblemCourses includes hld-problems"
);

// Problem course slugs come from `content.json`, not the directory name
// (e.g. `problems/csharp/` has slug `csharp-problems`), so the generated
// category lookup must key off the JSON slug.
const unmappedProblemCourses = problemCourses.filter(
  (c) => getCourseCategory(c.slug) === "courses"
);
assert(
  unmappedProblemCourses.length === 0,
  `Every problem course resolves to a category (unmapped: ${unmappedProblemCourses.map((c) => c.slug).join(", ") || "none"})`
);
assert(
  getCourseCategory("csharp-problems") === "backend",
  "getCourseCategory maps csharp-problems to backend"
);
assert(
  getCourseCategory("sql-problems") === "database",
  "getCourseCategory maps sql-problems to database"
);
assert(isProblemCourseSlug("csharp-problems"), "isProblemCourseSlug recognizes csharp-problems");
assert(!isProblemCourseSlug("csharp-fundamentals"), "isProblemCourseSlug ignores regular courses");
assert(
  getContentItemHref("csharp-problems", "01-arrays", "two-sum").startsWith(
    "/backend/problems/csharp-problems/"
  ),
  "getContentItemHref builds problem URLs with the category segment"
);

// Test getLessonsForCourse
const csharpLessons = getLessonsForCourse("csharp-problems");
assert(Array.isArray(csharpLessons), "getLessonsForCourse returns an array");
assert(csharpLessons.length > 0, "getLessonsForCourse returns lessons for csharp-problems");
assert(
  csharpLessons.every((l) => l.courseSlug === "csharp-problems"),
  "All returned lessons belong to csharp-problems"
);

const sqlLessons = getLessonsForCourse("sql-problems");
assert(Array.isArray(sqlLessons), "getLessonsForCourse returns an array for sql-problems");
assert(sqlLessons.length > 0, "getLessonsForCourse returns lessons for sql-problems");
assert(
  sqlLessons.every((l) => l.courseSlug === "sql-problems"),
  "All returned lessons belong to sql-problems"
);

const systemDesignLessons = getLessonsForCourse("system-design");
assert(
  Array.isArray(systemDesignLessons),
  "getLessonsForCourse returns an array for system-design"
);
assert(systemDesignLessons.length > 0, "getLessonsForCourse returns lessons for system-design");
assert(
  systemDesignLessons.every((l) => l.courseSlug === "system-design"),
  "All returned lessons belong to system-design"
);

const azureLessons = getLessonsForCourse("azure-problems");
assert(Array.isArray(azureLessons), "getLessonsForCourse returns an array for azure-problems");
assert(azureLessons.length > 0, "getLessonsForCourse returns lessons for azure-problems");
assert(
  azureLessons.every((l) => l.courseSlug === "azure-problems"),
  "All returned lessons belong to azure-problems"
);

const lldLessons = getLessonsForCourse("lld-problems");
assert(Array.isArray(lldLessons), "getLessonsForCourse returns an array for lld-problems");
assert(lldLessons.length > 0, "getLessonsForCourse returns lessons for lld-problems");
assert(
  lldLessons.every((l) => l.courseSlug === "lld-problems"),
  "All returned lessons belong to lld-problems"
);

const hldLessons = getLessonsForCourse("hld-problems");
assert(Array.isArray(hldLessons), "getLessonsForCourse returns an array for hld-problems");
assert(hldLessons.length > 0, "getLessonsForCourse returns lessons for hld-problems");
assert(
  hldLessons.every((l) => l.courseSlug === "hld-problems"),
  "All returned lessons belong to hld-problems"
);

// Test search for problems
const problemSearch = searchAll("array");
assert(problemSearch.length > 0, "searchAll finds array-related content");

// Test search for question answers
const questionSearch = searchAll("C#");
assert(questionSearch.length > 0, "searchAll finds C# question answers");

// ── Question answer structure ────────────────────────────────────────────────
// Question answers are organised category-first:
//   content/<category>/question-answers/<technology>/<question>.json

const questionCategories = getQuestionCategories();
assert(questionCategories.length > 0, "getQuestionCategories returns at least one category");

const questionTechnologies = getQuestionTechnologies();
assert(questionTechnologies.length > 0, "getQuestionTechnologies returns at least one technology");

const questionAnswers = getAllLessons().filter((l) => l.courseSlug === "question-answers");
assert(questionAnswers.length > 0, "question-answers lessons exist");

const questionsWithoutTechnology = questionAnswers.filter((l) => !l.technology);
assert(
  questionsWithoutTechnology.length === 0,
  `Every question answer declares a technology (missing: ${questionsWithoutTechnology.map((l) => l.slug).join(", ") || "none"})`
);

const technologySlugs = new Set(questionTechnologies.map((t) => t.slug));
const questionsWithUnknownModule = questionAnswers.filter(
  (l) => !technologySlugs.has(l.moduleSlug)
);
assert(
  questionsWithUnknownModule.length === 0,
  `Every question answer lives in a technology module (orphans: ${questionsWithUnknownModule.map((l) => l.slug).join(", ") || "none"})`
);

const categoriesWithQuestions = new Set(questionTechnologies.map((t) => t.category));
assert(
  categoriesWithQuestions.size === questionCategories.length,
  "Every category that hosts a technology is reported by getQuestionCategories"
);

// Every technology must resolve to a category so its URLs stay category-prefixed.
const unresolvableTechnologies = questionTechnologies.filter((t) => !t.category);
assert(
  unresolvableTechnologies.length === 0,
  `Every question-answer technology resolves to a category (unresolved: ${unresolvableTechnologies.map((t) => t.slug).join(", ") || "none"})`
);

const sampleQuestion = questionAnswers[0];
const sampleHref = getContentItemHref(
  "question-answers",
  sampleQuestion.moduleSlug,
  sampleQuestion.slug
);
assert(
  /^\/(backend|frontend|database|architecture|devops|fundamentals|ai)\/question-answers\/[^/]+\/[^/]+$/.test(
    sampleHref
  ),
  `getContentItemHref builds category-prefixed question-answer URLs (got: ${sampleHref})`
);

const sampleTech = questionTechnologies[0];
assert(
  getContentItemHref("question-answers", sampleTech.slug).endsWith(
    `/question-answers/${sampleTech.slug}`
  ),
  "getContentItemHref builds question-answer technology URLs"
);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
