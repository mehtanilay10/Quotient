# AGENTS.md — Instructions for AI Coding Agents

This file is the repository-wide contract for AI assistants working on
**Quotient**, a Next.js 16 + React 19 + TypeScript learning app with JSON
content, NextAuth v5, and PostgreSQL.

Read this file first. Then read the document for the area you are changing. Do
not rely on memory of older Next.js versions.

---

## Documentation

| Area | File |
| --- | --- |
| System design, routes, rendering, caching, deployment | [agents/architecture.md](./agents/architecture.md) |
| Content schemas, block shapes, database tables, browser storage | [agents/data-model.md](./agents/data-model.md) |
| API contracts, auth, CSRF, rate limits, payloads | [agents/api.md](./agents/api.md) |
| Setup, commands, environment, content workflow, migrations, PWA, deployment | [agents/development.md](./agents/development.md) |
| TypeScript, client/server boundaries, React, styling, security | [agents/coding-conventions.md](./agents/coding-conventions.md) |
| Visual system, layout, accessibility, copy | [agents/ui-ux.md](./agents/ui-ux.md) |
| Content author role | [agents/content-author.md](./agents/content-author.md) |
| Frontend engineer role | [agents/frontend-engineer.md](./agents/frontend-engineer.md) |
| Reviewer role | [agents/reviewer.md](./agents/reviewer.md) |
| Content QA role | [agents/content-qa.md](./agents/content-qa.md) |

If a role guide and this file disagree, follow this file and update the role
guide. If a document and the code disagree, the code is the source of truth:
fix the document as part of the change.

---

## Non-negotiable boundaries

### 1. Content stays in `content/`

- Add lesson text, problems, questions, cheat sheets, roadmaps, glossary terms,
  and prompts as JSON under `content/`.
- Never hardcode lesson prose, lists, or examples in `app/` or `components/`.
- Page components resolve content and render it through the existing block
  system.

### 2. Client components must not import the content graph

- `@/lib/content` eagerly imports the entire content tree. Never import it from
  a `'use client'` file.
- For links and slugs in client components, use `@/lib/content-hrefs` or
  `@/content/categories`.
- Pass lesson metadata from a server component and strip `blocks` with
  `toLessonNavItem()` / `toLessonNavItems()` unless the component truly renders
  the body.

### 3. Generated index files are read-only

Do not edit these by hand:

```text
content/courses.ts
content/modules.ts
content/lessons.ts
content/categories.ts
content/roadmaps.ts
```

Run `yarn generate:content`, or let `yarn dev` / `yarn build` run it through
`predev` / `prebuild`. Glossary and prompt indexes are different:
`content/ai/glossary/index.ts` and `content/ai/prompts/index.ts` are maintained
manually. Register new terms and prompts there.

### 4. Preserve public reading and inline sign-in gating

- Anyone can read public content without signing in.
- Progress, bookmarks, notes, and offline saving require an account.
- When a signed-out visitor tries one of those actions, show the inline
  `SignInPrompt`. Do not redirect them away from the page.
- Progress and bookmarks are not persisted to `localStorage` in the current
  implementation. Legacy local data is migrated on sign-in by
  `lib/userSync.ts`.

### 5. Content registration is part of the change

A lesson is not discoverable until its slug is registered:

- module → `lessonSlugs` in the module `content.json`
- course → `moduleSlugs` in the course `content.json`
- cheat sheet technology → `moduleSlugs` in `content/cheatsheet.json`
- question-answer technology → `moduleSlugs` in
  `content/question-answers.json`

New glossary terms and prompts must also be added to their manual barrel.
Regenerate indexes after adding, removing, or renaming files.

### 6. Use existing patterns

- Reuse existing `ContentBlock` types before inventing a new one.
- Reuse providers, hooks, helpers, error boundaries, and UI primitives.
- Use semantic Tailwind tokens, not raw hex values.
- Use `next/link` for internal navigation. Use `next/image` only where the code
  already does; content images use the `ImageBlock` / `ImageModal` pattern.
- Use `apiFetch` for mutating client requests so CSRF is attached.
- Keep authenticated queries scoped by the server-resolved user ID.

### 7. Accessibility is a requirement

Every interactive element needs an accessible name. Use semantic landmarks,
visible focus, `aria-expanded` for disclosures, `role="note"` for callouts,
`aria-live` for dynamic status, and a focus trap for modals. Test keyboard and
reduced-motion behavior.

### 8. Do not weaken security or type safety

- Never commit `.env`, secrets, tokens, or credentials.
- Do not add `as any`, `// @ts-ignore`, or `// @ts-expect-error` to silence real
  errors.
- Do not bypass `createApiAuthHandler`, CSRF validation, Zod schemas, or
  per-user scoping.
- Do not add a database query that trusts a user ID supplied by the client.
- Do not expose server-only modules through client imports.

---

## Workflow

1. **Read the area first.** Open the files you will change, the document for that
   area, and at least one neighboring example.
2. **Check the working tree.** Do not revert or overwrite unrelated user
   changes. Preserve uncommitted work.
3. **Choose the smallest coherent change.** Do not mix unrelated refactors,
   content rewrites, or formatting churn into a feature or fix.
4. **Update the right layer.** Content fixes go in JSON; UI fixes in components;
   shared behavior in `lib/`; persistence in Prisma plus the API handler.
5. **Update documentation only where behavior changed.** Do not duplicate the
   same fact across documents; keep its canonical home in the relevant file.
6. **Verify before finishing.** Run the checks below and fix errors rather than
   suppressing them.

---

## Verification

Run these in order:

```bash
yarn typecheck
yarn lint
yarn test:content   # when content changed
yarn build          # routing, generated content, PWA, or deployment changes
```

`yarn typecheck` is the **only enforced type gate**. `next.config.ts` sets
`typescript.ignoreBuildErrors: true` because the build-time type pass is very
slow on this content-heavy repository. Never treat a successful `next build` as
proof that types are correct.

## Tooling and Infrastructure

### Dependency Management
- **Dependabot**: Configured in `.github/dependabot.yml` to automatically check for dependency updates weekly
- Review Dependabot PRs before merging to ensure compatibility

### Code Formatting
- **Prettier**: Configured in `.prettierrc` with project-specific settings
- Run `yarn prettier --write .` to format files (add to package.json scripts if needed)
- Generated content files are ignored via `.prettierignore`

### Security
- **Rate Limiting**: Distributed rate limiting using Upstash Redis for serverless compatibility
  - Falls back to in-memory for local development
  - Three-tier rate limiting on magic link endpoint (global, per-IP, per-email)
- **Security Headers**: Configured in `next.config.ts` and `middleware.ts`
  - HSTS, X-Frame-Options, X-Content-Type-Options, etc.
  - Middleware removes `x-powered-by` header
- **Environment Variables**: See `.env.example` for required configuration
  - Include Upstash Redis credentials for production deployments

---

## Do not

- Do not add top-level `/courses`, `/problems`, `/cheatsheet`, or
  `/question-answers` pages. Listings belong under `/[category]/…`.
- Do not re-enable `experimental.cacheComponents`; the prerendered lesson route
  count would exceed Vercel’s limit.
- Do not add login-gated `/user/*` pages to the sitemap or allow them in
  `robots.ts`.
- Do not reintroduce Prism, `react-code-block`, or `prism-react-renderer`.
  `react-shiki` is the highlighting layer.
- Do not import Mermaid on the server; keep the dynamic client pattern.
- Do not add content columns back to the footer.
- Do not replace the inline sign-in prompt with an automatic redirect.
- Do not hand-edit generated files or silently change unrelated content.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
