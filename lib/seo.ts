import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quotient.dev";
const SITE_NAME = "Quotient";
const DEFAULT_DESCRIPTION =
  "Structured courses, coding problems, cheat sheets, and question answers with runnable examples across C#, SQL, React, ASP.NET Core, system design, and more.";

export function buildMetadata({
  title,
  description,
  path = "",
  image,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const url = `${BASE_URL}${path}`;
  const ogImage = image ?? `${BASE_URL}/og-default.png`;

  return {
    title: fullTitle,
    description: desc,
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

export function buildLessonMetadata(opts: {
  title: string;
  description: string;
  moduleSlug: string;
  lessonSlug: string;
  /** Category-prefixed base path, e.g. `/backend/courses/aspnet-core`. */
  basePath: string;
}): Metadata {
  const { basePath } = opts;
  return buildMetadata({
    title: opts.title,
    description: opts.description,
    path: `${basePath}/${opts.moduleSlug}/${opts.lessonSlug}`,
  });
}

export function buildModuleMetadata(opts: {
  title: string;
  description: string;
  moduleSlug: string;
  /** Category-prefixed base path, e.g. `/backend/courses/aspnet-core`. */
  basePath: string;
}): Metadata {
  const { basePath } = opts;
  return buildMetadata({
    title: opts.title,
    description: opts.description,
    path: `${basePath}/${opts.moduleSlug}`,
  });
}
