# Coding Conventions

These rules describe how code and content are written in Quotient. They are
intended to keep the content-heavy build fast, the client bundle small, and the
learner experience consistent.

---

## 1. General principles

1. **Match the surrounding code.** Read the neighboring component, route, or
   lesson before adding a new pattern.
2. **Prefer a small extension over a parallel abstraction.** Reuse existing
   helpers, providers, block types, and API wrappers.
3. **Keep content in `content/`.** Do not hardcode lesson text in `app/` or
   `components/`.
4. **Keep server work on the server.** Do not ship the content graph or secrets
   to the browser.
5. **Make the smallest coherent change.** Do not mix unrelated refactors or
   content edits into a feature.
6. **Leave the tree verifiable.** Run the checks for the area you changed and
   fix failures instead of suppressing them.

---

## 2. TypeScript

- The project is strict TypeScript. Do not add `as any`, `// @ts-ignore`, or
  `// @ts-expect-error` to silence real errors.
- Use the domain types in `types/index.ts`. Extend the union or interface when a
  new shape is genuinely needed.
- Prefer `type` imports (`import type { Lesson } from '@/types'`).
- Narrow unknown values with guards or Zod. `lib/typeGuards.ts` holds shared
  guards; API input uses `lib/validators.ts`.
- Return `undefined` from content lookups and handle it at the route boundary;
  do not assert non-null on data derived from URLs.
- Keep JSON compatible with the declared interfaces. JSON imports are cast at
  the index boundary, so `yarn typecheck` will not catch a malformed lesson body
  by itself.

### Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Components | PascalCase, named export | `LessonSidebar` |
| Hooks | `use` prefix, camelCase file | `useUserPreferences.ts` |
| Functions / variables | camelCase | `getLessonBySlug` |
| Types / interfaces | PascalCase | `ContentBlock` |
| Constants | UPPER_SNAKE_CASE | `MAX_QUERY_LENGTH` |
| Content slugs | kebab-case | `what-is-csharp` |
| CSS tokens | semantic kebab names | `text-accent-fg` |

Use `@/` imports for project modules. Use relative imports only for siblings in
the same feature when that matches the local file.

---

## 3. Server and client boundaries

This is the most important performance rule in the repository.

### Server components

- Pages, layouts, metadata, and content resolution are server components by
  default. Keep them there unless interactivity is required.
- Import content helpers from `@/lib/content`.
- Import href-only helpers from `@/lib/content-hrefs`.
- Validate route params against content and call `notFound()` for mismatches.
- Pass only the fields a client component needs. For lessons, use
  `toLessonNavItem()` / `toLessonNavItems()` so `blocks` are not serialized into
  every page.

### Client components

- Add `'use client'` only when the file uses state, effects, refs, browser APIs,
  event handlers, or client-only libraries.
- **Never import `@/lib/content` from a client component.** It pulls the entire
  lesson graph into the browser bundle.
- Use `@/lib/content-hrefs` or the lightweight maps in `@/content/categories`
  when a client component must build a link.
- Fetch user data through `apiFetch` from `lib/apiFetch.ts`, not raw `fetch`,
  when the request mutates state.
- Keep providers near the root only when the state is genuinely app-wide.
  Feature-specific state belongs in a feature context or hook.

### Dynamic imports

- Shiki code blocks, Mermaid, and heavy modals are loaded with `next/dynamic`.
- Mermaid must never be imported server-side.
- Do not replace these with static imports for convenience.

---

## 4. Next.js App Router

- Dynamic route `params` are asynchronous in this Next.js version. Type them as
  `Promise<{ ... }>` and `await params`.
- Implement `generateStaticParams()` for every new dynamic content route, and
  return the canonical category alongside the slug segments.
- Add `generateMetadata()` or `buildMetadata()` for public pages.
- Use `next/link` for internal navigation. Use `<a target="_blank"
  rel="noopener noreferrer">` for external links.
- Use the metadata helpers in `lib/seo.ts` instead of hand-building Open Graph
  objects.
- Keep route-level loading and error files close to the route when they add
  value; otherwise use the shared boundaries.
- Do not re-enable `experimental.cacheComponents`. The build deliberately relies
  on static assets rather than counted route entries for thousands of lessons.

---

## 5. React

- Prefer function components and named exports.
- Keep components focused. Split a component when it owns unrelated pieces of
  state or renders multiple distinct sections.
- Do not derive state in effects when it can be computed during render.
- Reset user-scoped state when the session changes; do not leak one user’s data
  into another session.
- Use `useMemo` and `useCallback` only for measurable need (expensive
  computation, stable dependencies), not by default.
- Use `cn()` from `lib/utils.ts` for conditional classes. Do not concatenate
  Tailwind class strings manually when conflicts are possible.
- Give every list item a stable key derived from content (`slug` or `id`), not
  the array index when the list can reorder.
- Use the existing error boundaries (`ErrorBoundaryWrapper`,
  `CourseErrorBoundary`, `SearchErrorBoundary`, provider-specific boundaries)
  around risky client rendering.

### Comments

Write comments for intent, constraints, and non-obvious behavior. Do not narrate
what the code already says. Existing comments often explain build-time limits,
security decisions, or content quirks; preserve that context when editing.

---

## 6. Content authoring

- Use the block shapes declared in `types/index.ts`.
- Use the nested `data` shape for blocks. Legacy flat blocks exist, but new
  content should match current neighbors and the `ContentBlock` type.
- Choose the simplest block that communicates the idea. Do not invent a new
  block type for a one-off visual variation.
- Add a new block type only when existing types cannot express the content.
  Update the union in `types/index.ts` and every relevant case in
  `ContentBlockRenderer.tsx`.
- Keep `order` values explicit and unique within their parent.
- Keep `courseSlug` and `moduleSlug` aligned with the parent directories.
- Register every lesson/module/technology in the relevant `content.json` array.
- Keep `relatedLessons` inside the same course. Keep `relatedGlossaryTerms`
  pointing at real glossary slugs.
- Use honest difficulty labels:
  - `beginner`: no prior programming background required;
  - `intermediate`: basic programming comfort assumed;
  - `advanced`: requires preceding modules or equivalent experience.
- Cheat-sheet examples are code-only, with a correct `language`.
- Include an `id` and `caption` on every Mermaid diagram.
- Give images meaningful `alt` text.
- Never edit generated content index files; run `yarn generate:content`.

---

## 7. Styling

- Use Tailwind CSS exclusively. Inline `style` is acceptable only for dynamic
  values such as a progress width.
- Use semantic tokens (`bg-canvas-subtle`, `text-fg-muted`, `border-border`,
  `text-accent-fg`, `bg-danger-subtle`) instead of raw hex values.
- Test both light and dark mode. Tokens are defined in `app/globals.css` and
  exposed in `tailwind.config.ts`.
- Design mobile-first. Start with the small-screen layout, then add `sm:`,
  `md:`, `lg:`, and `xl:` enhancements.
- Reuse component classes and layout primitives before adding new ones.
- Do not add global CSS for a feature unless the styles genuinely belong to the
  token system or must apply before hydration.

### Code and diagrams

- Use `react-shiki` (`ShikiHighlighter`) through the existing code-block
  component. Do not add Prism, `react-code-block`, or `prism-react-renderer`.
- Active Shiki themes are `github-dark` and `github-light`, driven by
  `next-themes`.
- Mermaid is client-only and loaded through `MermaidRenderer`.

---

## 8. API routes

- Put route handlers under `app/api/<feature>/route.ts`.
- Wrap authenticated handlers with `createApiAuthHandler` from
  `lib/authMiddleware.ts`. Do not read the session and query by email manually.
- Use `getOrCreateUser` from the wrapper; handlers receive the Prisma user.
- Validate request bodies with Zod schemas in `lib/validators.ts`. Add a schema
  there rather than defining an ad-hoc shape in the route.
- Reject unknown or oversized payloads. Do not silently persist partial data.
- Use `apiFetch` on the client so CSRF headers are attached.
- Return `{ code, message, details? }` for errors and use the helpers in
  `lib/errorHandler.ts`.
- Add a route-specific rate limit for expensive or mutating operations, and keep
  the 60/minute pre-auth wrapper intact.
- Scope every query by the authenticated user ID. Never accept a user ID from
  the request body.
- Clear the relevant in-memory cache after writes.
- Dynamic-import Prisma inside handlers (`const { prisma } = await import(...)`)
  to match the existing pattern.
- Do not log secrets, tokens, full note content, or email bodies.

---

## 9. Data fetching and state

| Need | Use |
| --- | --- |
| Content for a server page | `lib/content.ts` |
| Link/href in a client component | `lib/content-hrefs.ts` |
| Session | `useSession()` / server `auth()` |
| Progress | `useProgress()` |
| Bookmarks | `useBookmarks()` |
| Preferences | `usePreferencesContext()` in client components |
| Theme | `useUserTheme()` or `next-themes` |
| Mutating API request | `apiFetch` |
| Retrying transient failures | `retryWithBackoff` |

Do not bypass the progress/bookmark providers with direct API calls from random
components. Do not call `useUserPreferences()` in a shared component; the
provider is the supported interface.

Signed-out users must not be redirected away from reading content. Show
`SignInPrompt` when they attempt to save progress, bookmarks, notes, or offline
items.

---

## 10. Security

- Never commit `.env`, secrets, tokens, or credentials. `.env.example` is the
  committed template.
- Only expose `NEXT_PUBLIC_*` variables to the browser.
- Treat all content and query strings as untrusted. Do not inject raw HTML.
- Use the CSRF helpers and `apiFetch`; do not disable CSRF for convenience.
- Keep authorization checks on the server. Hiding a button is not
  authorization.
- Rate limits are defense in depth, not a substitute for validation.
- External links use `rel="noopener noreferrer"`.
