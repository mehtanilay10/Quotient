import type {
  ContentBlock,
  Lesson,
  Module,
  BookmarkItem,
  ProgressState,
  BookmarkState,
  GlossaryTerm,
  PromptTemplate,
  AdvancedConcept,
  GlossaryCategory,
  PromptCategory,
} from "@/types";

export function isContentBlock(value: unknown): value is ContentBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  if (typeof block.type !== "string") return false;
  return [
    "paragraph",
    "heading",
    "bullet-list",
    "numbered-list",
    "callout",
    "quote",
    "key-terms",
    "table",
    "example",
    "code",
    "solution",
    "exercise",
    "checklist",
    "mermaid",
    "comparison-cards",
    "summary-box",
    "faq-block",
    "divider",
    "image",
  ].includes(block.type);
}

export function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== "object") return false;
  const lesson = value as Record<string, unknown>;
  return (
    typeof lesson.id === "string" &&
    typeof lesson.slug === "string" &&
    typeof lesson.moduleSlug === "string" &&
    typeof lesson.courseSlug === "string" &&
    typeof lesson.title === "string" &&
    typeof lesson.order === "number"
  );
}

export function isModule(value: unknown): value is Module {
  if (!value || typeof value !== "object") return false;
  const module_ = value as Record<string, unknown>;
  return (
    typeof module_.id === "string" &&
    typeof module_.slug === "string" &&
    typeof module_.courseSlug === "string" &&
    typeof module_.title === "string" &&
    typeof module_.order === "number" &&
    Array.isArray(module_.lessonSlugs)
  );
}

export function isBookmarkItem(value: unknown): value is BookmarkItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.type === "string" &&
    typeof item.slug === "string" &&
    typeof item.title === "string" &&
    typeof item.courseSlug === "string" &&
    typeof item.moduleSlug === "string" &&
    typeof item.addedAt === "string"
  );
}

export function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state.lessons === "object" &&
    typeof state.problems === "object" &&
    typeof state.questionAnswers === "object"
  );
}

export function isBookmarkState(value: unknown): value is BookmarkState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return Array.isArray(state.items);
}

export function isGlossaryTermArray(value: unknown): value is GlossaryTerm[] {
  if (!Array.isArray(value)) return false;
  const validCategories: GlossaryCategory[] = [
    "core-concepts",
    "models-and-training",
    "prompting",
    "tools-and-apis",
    "agents-and-automation",
    "safety-and-ethics",
    "architecture",
    "multimodal",
    "evaluation",
  ];
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const term = item as Record<string, unknown>;
    return (
      typeof term.id === "string" &&
      typeof term.slug === "string" &&
      typeof term.term === "string" &&
      typeof term.shortDefinition === "string" &&
      typeof term.fullDefinition === "string" &&
      typeof term.category === "string" &&
      validCategories.includes(term.category as GlossaryCategory) &&
      typeof term.difficulty === "string"
    );
  });
}

export function isPromptTemplateArray(value: unknown): value is PromptTemplate[] {
  if (!Array.isArray(value)) return false;
  const validCategories: PromptCategory[] = [
    "writing",
    "thinking",
    "research",
    "coding",
    "creativity",
    "productivity",
    "learning",
    "analysis",
    "summarization",
  ];
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const template = item as Record<string, unknown>;
    return (
      typeof template.id === "string" &&
      typeof template.slug === "string" &&
      typeof template.title === "string" &&
      typeof template.description === "string" &&
      typeof template.category === "string" &&
      validCategories.includes(template.category as PromptCategory) &&
      typeof template.difficulty === "string" &&
      typeof template.template === "string" &&
      Array.isArray(template.tags)
    );
  });
}

export function isAdvancedConceptArray(value: unknown): value is AdvancedConcept[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const concept = item as Record<string, unknown>;
    return (
      typeof concept.id === "string" &&
      typeof concept.slug === "string" &&
      typeof concept.title === "string" &&
      typeof concept.description === "string" &&
      typeof concept.category === "string" &&
      typeof concept.difficulty === "string" &&
      Array.isArray(concept.blocks)
    );
  });
}
