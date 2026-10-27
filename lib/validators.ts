import { z } from "zod";

// Shared field constraints. Content slugs are short ASCII segments; titles
// come from lesson metadata; caps prevent unbounded rows from being written.
const SlugSchema = z.string().min(1).max(200);
const TitleSchema = z.string().min(1).max(300);

export const ProgressEntrySchema = z.object({
  category: z.enum(["lessons", "problems", "questionAnswers"]),
  lessonSlug: SlugSchema,
  moduleSlug: SlugSchema,
});

export const ProgressPayloadSchema = z.object({
  entries: z.array(ProgressEntrySchema).max(1000).optional(),
});

export const BookmarkEntrySchema = z.object({
  type: z.enum(["lesson", "problem", "questionAnswer", "cheatsheet"]),
  slug: SlugSchema,
  title: TitleSchema,
  courseSlug: SlugSchema,
  moduleSlug: SlugSchema,
});

export const BookmarkPayloadSchema = z.object({
  items: z.array(BookmarkEntrySchema).max(1000).optional(),
});

export const BookmarkDeleteSchema = z.object({
  slug: SlugSchema,
  type: z.enum(["lesson", "problem", "questionAnswer", "cheatsheet"]),
});

export const NotePayloadSchema = z.object({
  courseSlug: SlugSchema,
  moduleSlug: SlugSchema,
  lessonSlug: SlugSchema,
  content: z.string().min(1).max(50_000),
});

export const NoteDeleteSchema = z.object({
  courseSlug: SlugSchema,
  moduleSlug: SlugSchema,
  lessonSlug: SlugSchema,
});

export const ThemePayloadSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export const LastPathPayloadSchema = z.object({
  path: z.string().min(1).max(2000),
});

export const OfflineQueueEntrySchema = z.object({
  courseSlug: SlugSchema,
  moduleSlug: SlugSchema,
  lessonSlug: SlugSchema,
  title: TitleSchema,
});

export const OfflineQueuePayloadSchema = z.object({
  entries: z.array(OfflineQueueEntrySchema).max(500).optional(),
});

export const OfflineQueueDeleteSchema = z.object({
  courseSlug: SlugSchema,
  moduleSlug: SlugSchema,
  lessonSlug: SlugSchema,
});
