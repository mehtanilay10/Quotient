// ─────────────────────────────────────────────────────────────────────────────
// Core domain types for Quotient course website
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared primitives ────────────────────────────────────────────────────────

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type CalloutVariant = 'info' | 'tip' | 'warning' | 'note' | 'important' | 'danger' | 'error';

// ── Content block system ─────────────────────────────────────────────────────

export interface MermaidDiagram {
  id: string;
  caption?: string;
  definition: string;
}

export interface ComparisonCardItem {
  title: string;
  description: string;
  pros?: string[];
  cons?: string[];
  tags?: string[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface KeyTermItem {
  term: string;
  definition: string;
  learnMoreSlug?: string; // links to glossary
}

export interface ChecklistItem {
  text: string;
  hint?: string;
}

export interface ExerciseData {
  title: string;
  description: string;
  steps?: string[];
  expectedOutcome?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// Discriminated union of all block types for type-safe rendering
export type ContentBlock =
  | {
      type: 'paragraph';
      id?: string;
      data: { text: string };
    }
  | {
      type: 'heading';
      id?: string;
      data: { level: 2 | 3 | 4; text: string; anchor?: string };
    }
  | {
      type: 'bullet-list';
      id?: string;
      data: { items: string[]; title?: string };
    }
  | {
      type: 'numbered-list';
      id?: string;
      data: { items: string[]; title?: string };
    }
  | {
      type: 'callout';
      id?: string;
      data: { variant: CalloutVariant; title?: string; text: string };
    }
  | {
      type: 'quote';
      id?: string;
      data: { text: string; attribution?: string };
    }
  | {
      type: 'key-terms';
      id?: string;
      data: { terms: KeyTermItem[] };
    }
  | {
      type: 'table';
      id?: string;
      data: TableData;
    }
  | {
      type: 'example';
      id?: string;
      data: { title?: string; content: string; code?: string; language?: string };
    }
  | {
      type: 'code';
      id?: string;
      data: { language: string; caption?: string; code: string };
    }
  | {
      type: 'solution';
      id?: string;
      data: { title?: string; content: string; code: string; language?: string };
    }
  | {
      type: 'exercise';
      id?: string;
      data: ExerciseData;
    }
  | {
      type: 'checklist';
      id?: string;
      data: { title?: string; items: ChecklistItem[] };
    }
  | {
      type: 'mermaid';
      id?: string;
      data: MermaidDiagram;
    }
  | {
      type: 'comparison-cards';
      id?: string;
      data: { title?: string; cards: ComparisonCardItem[] };
    }
  | {
      type: 'summary-box';
      id?: string;
      data: { title?: string; points: string[]; takeaway?: string };
    }
  | {
      type: 'faq-block';
      id?: string;
      data: { title?: string; items: FAQItem[] };
    }
  | {
      type: 'divider';
      id?: string;
      data: Record<string, never>;
    }
  | {
      type: 'image';
      id?: string;
      data: { src: string; alt: string; caption?: string };
    };

// ── Table of Contents ────────────────────────────────────────────────────────

export interface TocEntry {
  anchor: string;
  text: string;
  level: 2 | 3 | 4;
}

// ── Course ────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  category?: string;
  /** URL category derived from the content directory structure (e.g. "dotnet"). Stamped by the content generator. */
  urlCategory?: string;
  isQuestionAnswer?: boolean;
  moduleSlugs: string[]; // ordered list of module slugs belonging to this course
}

// ── Module ───────────────────────────────────────────────────────────────────

export interface Module {
  id: string;
  slug: string;
  courseSlug: string;
  title: string;
  description: string;
  longDescription?: string;
  order: number;
  difficulty: Difficulty;
  estimatedHours: number;
  icon: string;
  /** URL category derived from the content directory structure (e.g. "dotnet"). Stamped by the content generator. */
  urlCategory?: string;
  tags?: string[];
  lessonSlugs?: string[]; // ordered list of lesson slugs
  isOptional?: boolean;
  skipLabel?: string;
  prerequisites?: string[]; // module slugs
  whatYouLearn?: string[];
}

// ── Further Reading ──────────────────────────────────────────────────────────

export type FurtherReadingType = 'article' | 'video' | 'course' | 'tool';

export interface FurtherReadingItem {
  title: string;
  url: string;
  type: FurtherReadingType;
  author?: string;
  description?: string;
}

// ── Lesson ───────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  slug: string;
  moduleSlug: string;
  courseSlug: string;
  title: string;
  description: string;
  order: number;
  difficulty: Difficulty;
  estimatedMinutes: number;
  tags?: string[];
  technology?: string;
  prerequisites?: string[]; // lesson slugs
  isOptional?: boolean;
  skipLabel?: string;
  blocks: ContentBlock[];
  relatedLessons?: string[]; // lesson slugs
  relatedGlossaryTerms?: string[]; // glossary term slugs
  furtherReading?: FurtherReadingItem[];
}

/**
 * Lesson metadata without the heavy `blocks` content.
 *
 * Use this for lessons handed to client components (sidebar, lesson cards,
 * filters, action buttons) — they only render metadata, but because every prop
 * of a client component is serialized into each page's RSC payload, including
 * `blocks` would embed the full content of *every* lesson of a course into
 * *every* page of that course at build time.
 */
export type LessonNavItem = Omit<Lesson, 'blocks'>;

// ── Tool Comparison ──────────────────────────────────────────────────────────

// ── Weekly / 90-Day Plan ─────────────────────────────────────────────────────

export type PlanWeekFocus =
  | 'foundations'
  | 'tools'
  | 'prompting'
  | 'workflows'
  | 'automation'
  | 'agents'
  | 'advanced'
  | 'review';

export interface PlanWeek {
  id: string;
  week: number;
  title: string;
  focus: PlanWeekFocus;
  description: string;
  goals: string[];
  moduleSlugs?: string[];
  lessonSlugs?: string[];
  tools?: string[];
  tip?: string;
}

// ── FAQs ─────────────────────────────────────────────────────────────────────

export type FAQCategory =
  | 'getting-started'
  | 'tools'
  | 'learning-path'
  | 'concepts'
  | 'safety'
  | 'career';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  tags?: string[];
  relatedLessons?: string[];
}

// ── Advanced Concepts ────────────────────────────────────────────────────────

export type AdvancedConceptCategory =
  | 'llm-internals'
  | 'prompting-advanced'
  | 'rag-and-memory'
  | 'agents'
  | 'evaluation'
  | 'deployment'
  | 'safety';

export interface AdvancedConcept {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: AdvancedConceptCategory;
  difficulty: Exclude<Difficulty, 'beginner'>;
  prerequisites?: string[]; // lesson slugs
  blocks: ContentBlock[];
  relatedConcepts?: string[];
}

// ── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  isNew?: boolean;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ── Progress ─────────────────────────────────────────────────────────────────

export interface LessonProgress {
  lessonSlug: string;
  moduleSlug: string;
  completedAt: string; // ISO date string
}

export interface CourseProgress {
  completedLessons: LessonProgress[];
  lastVisitedLesson?: string;
  startedAt?: string;
}

export interface ProgressState {
  lessons: CourseProgress;
  problems: CourseProgress;
  questionAnswers: CourseProgress;
}

/** The progress buckets tracked independently for each content type. */
export type ProgressCategory = keyof ProgressState;

export interface BookmarkState {
  items: BookmarkItem[];
}

export interface BookmarkItem {
  id: string;
  type: 'lesson' | 'problem' | 'questionAnswer' | 'cheatsheet';
  slug: string;
  title: string;
  courseSlug: string;
  moduleSlug: string;
  addedAt: string;
}

// ── Roadmaps ─────────────────────────────────────────────────────────────────

/**
 * What a roadmap step points at. Steps reference existing content by slug so
 * roadmap links always resolve to real courses / problems / cheat sheets /
 * question-answer technologies. `link` is for special pages (e.g. the AI glossary)
 * and carries its own title and href.
 */
export type RoadmapStepKind = 'course' | 'problems' | 'cheatsheet' | 'questionAnswer' | 'link';

export interface RoadmapStep {
  kind: RoadmapStepKind;
  /** Course/problem slug, cheatsheet or question-answer technology slug, or the href for `link`. */
  ref: string;
  /** Display title for `link` steps; other kinds resolve their title from content. */
  title?: string;
  /** Short guidance shown under the step, e.g. why or how to work through it. */
  note?: string;
}

export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  level: Difficulty;
  /** Rough time budget for the stage, e.g. "3–4 weeks". */
  duration?: string;
  /** What the learner should be able to do after finishing the stage. */
  milestone?: string;
  steps: RoadmapStep[];
}

/**
 * A curated, ordered learning path for one category. Lives at
 * `content/<category>/roadmaps/roadmap.json` and is served at
 * `/<category>/roadmap`.
 */
export interface Roadmap {
  id: string;
  slug: string; // "roadmap"
  category: string;
  title: string;
  description: string;
  icon: string;
  /** Who this roadmap is for. */
  audience?: string;
  /** Rough total time estimate, e.g. "4–6 months". */
  estimatedTotal?: string;
  /** Short intro paragraph shown under the header. */
  intro?: string;
  stages: RoadmapStage[];
}

/** A roadmap step resolved against the content graph (title, href, counts). */
export interface ResolvedRoadmapStep {
  kind: RoadmapStepKind;
  title: string;
  description: string;
  href: string;
  icon: string;
  /** e.g. "24 lessons", "12 problems", "36 questions". */
  meta?: string;
  note?: string;
}

// ── Search ───────────────────────────────────────────────────────────────────

/** Where a query term matched, used to explain and rank results. */
export type SearchMatchField = 'title' | 'description' | 'tag';

export interface SearchResult {
  type: 'lesson' | 'module' | 'course' | 'cheatsheet';
  slug: string;
  title: string;
  description: string;
  courseSlug?: string;
  moduleSlug?: string;
  difficulty?: Difficulty;
  tags?: string[];
  technology?: string;
  /** Relevance score (higher is better). Populated by `searchAll`. */
  score?: number;
  /** The strongest field the query matched, e.g. `title`. */
  matchField?: SearchMatchField;
  /** Description excerpt around the match, for snippet highlighting. */
  snippet?: string;
}

// ── Glossary ─────────────────────────────────────────────────────────────────

export type GlossaryCategory =
  | 'core-concepts'
  | 'models-and-training'
  | 'prompting'
  | 'tools-and-apis'
  | 'agents-and-automation'
  | 'safety-and-ethics'
  | 'architecture'
  | 'multimodal'
  | 'evaluation';

export interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
  phonetic?: string;
  shortDefinition: string;
  fullDefinition: string;
  category: GlossaryCategory;
  difficulty: Difficulty;
  relatedTerms?: string[]; // slugs
  learnMoreSlug?: string; // lesson slug
  examples?: string[];
  alsoKnownAs?: string[];
}

// ── Prompt Templates ─────────────────────────────────────────────────────────

export type PromptCategory =
  | 'writing'
  | 'thinking'
  | 'research'
  | 'coding'
  | 'creativity'
  | 'productivity'
  | 'learning'
  | 'analysis'
  | 'summarization';

export interface PromptTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: PromptCategory;
  difficulty: Difficulty;
  template: string; // use [BRACKETS] for placeholders
  example?: string;
  tags: string[];
  tips?: string[];
  isStarter?: boolean;
}

// ── Tool Comparison ──────────────────────────────────────────────────────────

export type ToolCategory =
  | 'chatbot'
  | 'image-generation'
  | 'coding'
  | 'writing'
  | 'automation'
  | 'search'
  | 'voice'
  | 'video'
  | 'productivity'
  | 'local-ai';

export interface ToolFeature {
  name: string;
  supported: boolean | 'partial' | 'unknown';
  note?: string;
}

export interface ToolEntry {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  url?: string;
  pricing: 'free' | 'freemium' | 'paid' | 'open-source';
  difficulty: Difficulty;
  bestFor: string[];
  limitations?: string[];
  features?: ToolFeature[];
  logoEmoji?: string;
  isPopular?: boolean;
  isBeginnnerPick?: boolean;
}

// ── Mini Projects ────────────────────────────────────────────────────────────

export interface MiniProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours: number;
  tags: string[];
  skills: string[];
  tools: string[];
  steps: string[];
  expectedOutput: string;
  bonusChallenges?: string[];
  relatedLessons?: string[]; // lesson slugs
}
