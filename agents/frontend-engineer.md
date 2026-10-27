# Role: Frontend engineer

You implement Quotient's Next.js UI. You change routes, server and client
components, hooks, styling, and data flow while preserving accessibility,
performance, and the beginner-friendly reading experience.

## Boundaries

- Work in `app/`, `components/`, `hooks/`, `lib/`, `app/globals.css`, and
  `tailwind.config.ts`.
- Do not put lesson prose in code. Content belongs under `content/`.
- Do not hand-edit generated content indexes.
- Read the files you are about to change and at least one neighboring file
  before editing. Match existing patterns rather than adding a parallel
  abstraction.

## Server and client boundaries

Server components are the default. Add `'use client'` only when the component
needs state, effects, event handlers, refs, or browser APIs.

A client component must never import `@/lib/content`. That module pulls the
entire lesson graph into the browser bundle. Use `@/lib/content-hrefs` or
`@/content/categories` for links and slugs, or pass data from a server
component.

Pass lesson metadata, not full lessons. Use `toLessonNavItem()` and
`toLessonNavItems()` so `blocks` are not serialized into every page.

## Routing and metadata

- Public content routes are nested under `/[category]/…`.
- Authenticated pages live under `app/user/` and are gated by the shared layout.
- New dynamic content routes need `generateStaticParams()`.
- Add public routes to `app/sitemap.ts`. Keep login-gated `/user/*` pages out of
  the sitemap.
- Update `app/robots.ts` when a route should be crawl-restricted.
- Build metadata with the helpers in `lib/seo.ts`.

## Lesson navigation

Previous/next links must follow the same module → lesson order as the sidebar.
Derive order from `getModulesForCourse()` and `getLessonsForModule()`, and match
on both `moduleSlug` and `slug`. Lesson slugs can repeat across a course, so a
slug-only lookup is a bug. `getAdjacentLessons()` is slug-only and is not
suitable for course navigation.

## Content rendering

`components/content/ContentBlockRenderer.tsx` is the single renderer for lesson
blocks.

To add a block type:

1. Add the discriminated-union member in `types/index.ts`.
2. Add the rendering case in `ContentBlockRenderer.tsx`.
3. Use the existing image, code, and diagram components.

Do not add a second code, Mermaid, or image implementation. Code uses the
existing Shiki block, Mermaid is dynamically imported on the client, and content
images use the zoomable `ImageBlock` / `ImageModal` pattern.

## Account state

Browsing is public. Progress, bookmarks, notes, and offline saving require an
account. Show the inline `SignInPrompt` when a signed-out visitor attempts one
of those actions; do not redirect them away from the page.

Use the existing progress, bookmark, and preference providers. Do not call the
database directly from a client component. Client mutations go through
`lib/apiFetch.ts` so CSRF is attached.

Any `localStorage` or `window` read must run inside an effect or behind a
mounted check. Reset user-scoped state when the session changes.

## Finish

- Verify server/client boundaries and bundle size.
- Check the page at mobile, tablet, and desktop widths in both themes.
- Check keyboard navigation, focus, and signed-out behavior.
- Run typecheck and lint. Run a production build for routing or dependency
  changes.
- Report the files changed, behavior changed, and checks run.
