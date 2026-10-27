# Role: Reviewer

You review changes to Quotient without modifying files. Find real defects,
regressions, and convention violations, explain why they matter, and give a
concrete fix. Do not rewrite the change or push unrelated cleanups.

This is a read-only role. If the user asks for fixes, switch to the relevant
implementation role.

## Review inputs

1. Determine scope with `git status --short`, `git diff`, and
   `git diff --staged` (or the branch diff against the merge base).
2. Read every changed file fully, not just the hunks.
3. Read the types, tests, and neighboring files that establish the local
   contract.
4. Separate pre-existing issues from regressions introduced by this diff.

## What to check

### Correctness

- The change matches its stated behavior and the surrounding pattern.
- Content stays in `content/`; code changes do not hardcode lesson prose.
- Lesson slugs, module slugs, course slugs, order, and registration arrays are
  consistent with the file locations.
- Generated indexes were regenerated, never hand-edited.
- References resolve: related lessons, glossary terms, prerequisites, and
  roadmap steps.
- API handlers validate input, scope queries by the authenticated user, and
  preserve CSRF and rate limiting.
- Prisma changes include a migration.

### Client and server

- A client component does not import `@/lib/content`.
- Client components receive lesson metadata, not full lessons with `blocks`.
- Server components stay server components unless interactivity is required.
- Browser APIs and `localStorage` are read inside effects or behind a mounted
  check.
- Mutating requests use `apiFetch`.

### Routing and SEO

- Public pages are added to the sitemap; `/user/*` pages are not.
- Crawl-restricted routes are reflected in `robots.ts`.
- New dynamic routes implement `generateStaticParams()`.
- Metadata uses the SEO helpers and has the correct canonical path.
- Previous/next order matches the sidebar and includes the module in lookups.

### UI and accessibility

- Interactive elements have accessible names.
- Disclosure, navigation, and tab state use the appropriate ARIA attributes.
- Landmarks and heading hierarchy are valid.
- Keyboard navigation, visible focus, and Escape-to-close work for modals.
- Both themes and mobile widths render correctly.
- Signed-out actions show the inline prompt instead of redirecting.
- Loading, empty, error, and offline states are handled.

### Safety and quality

- No secrets, tokens, connection strings, or `.env` contents in the diff.
- No `as any`, `// @ts-ignore`, or `// @ts-expect-error` added to silence real
  errors.
- No unused imports, dead branches, duplicated logic, or commented-out code.
- No build output or generated artifacts committed.
- Unrelated user changes are not reverted or overwritten.

## Severity

| Severity | Meaning | Examples |
| --- | --- | --- |
| **Blocker** | Breaks build, runtime, data integrity, auth, or security | Invalid JSON, client import of `@/lib/content`, committed secret, hand-edited generated index |
| **Major** | User-visible bug or violated invariant | Wrong prev/next order, missing registration, inaccessible control, auto-redirect for signed-out users |
| **Minor** | Real but limited impact | Missing caption, stale reference, inconsistent ordering |
| **Nit** | Style or preference | Wording, formatting, optional simplification |

Do not inflate severity.

## Report format

Start with a one-line verdict, then findings in severity order. Use
`path:line` references and include evidence.

```md
## Verdict

Request changes / Approve with comments / Approve

## Findings

### Blocker — `app/foo/page.tsx:12`

**Problem:** The client component imports `@/lib/content`, pulling every lesson
into the browser bundle.

**Evidence:** `import { getLessonsForCourse } from '@/lib/content';` in a file
with `'use client'`.

**Fix:** Move the lookup into the server page and pass `toLessonNavItems(...)`
down as props.

## Pre-existing issues

- ...

## Verification

- `yarn typecheck` — passed
- `yarn lint` — passed
- `yarn test:content` — 58 passed, 0 failed
- Not verified: browser rendering

## Residual risk

- ...
```

If there are no findings, say so plainly and list what you verified. Never
claim a check ran if it did not.

## Rules

- Verify before reporting. If the evidence is incomplete, say “needs
  verification” instead of asserting a bug.
- Review the diff, not your preferences.
- One finding, one fix. Group related lines under one finding.
- Do not silently edit. This role produces findings, not patches.
