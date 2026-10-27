# Development

This guide covers local setup, commands, content workflow, authentication,
database migrations, PWA testing, and deployment.

---

## 1. Prerequisites

| Requirement      | Version / notes                     |
| ---------------- | ----------------------------------- |
| Node.js          | `>=20.9.0` (required by Next.js 16) |
| Package manager  | Yarn 1.22+                          |
| Database         | PostgreSQL, normally Neon           |
| Resend account   | Only needed to send magic links     |
| Google OAuth app | Only needed for Google sign-in      |

No Python, Java, or .NET SDK is required to run the site. Lesson code samples
are displayed, not executed.

---

## 2. First-time setup

```bash
yarn install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Fill in the values described in [Environment variables](#environment-variables).
At minimum, set `DATABASE_URL` and `AUTH_SECRET` for account features.

Generate the Prisma Client and create the schema:

```bash
yarn db:generate
yarn db:migrate
```

`yarn db:migrate` runs `prisma migrate dev`, creates a migration if the schema
changed, and applies it. For a throwaway database you can use `yarn db:push`
instead.

Start the app:

```bash
yarn dev
```

Open <http://localhost:3000>. `predev` regenerates the content indexes before
Next.js starts.

---

## 3. Commands

| Command                 | What it does                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `yarn dev`              | Regenerates content indexes, then starts Next.js with Webpack                                 |
| `yarn build`            | Regenerates content indexes, then builds for production with Webpack                          |
| `yarn start`            | Serves the production build                                                                   |
| `yarn lint`             | Runs ESLint over `.ts` and `.tsx` files                                                       |
| `yarn typecheck`        | Runs `tsc --noEmit`; the enforced type gate                                                   |
| `yarn test:content`     | Validates content structure and references                                                    |
| `yarn generate:content` | Rebuilds `content/courses.ts`, `modules.ts`, `lessons.ts`, `categories.ts`, and `roadmaps.ts` |
| `yarn db:generate`      | Generates Prisma Client from the schema                                                       |
| `yarn db:push`          | Pushes the schema without migration history                                                   |
| `yarn db:migrate`       | Creates and applies a development migration                                                   |
| `yarn db:studio`        | Opens Prisma Studio                                                                           |
| `yarn vercel-build`     | Generates Prisma Client, deploys migrations, builds Next.js                                   |

Use Yarn for project scripts. `yarn prisma <command>` is also available for
Prisma CLI operations.

### Verification order

Before calling a change complete:

```bash
yarn typecheck
yarn lint
```

Run `yarn test:content` when changing `content/`. Run `yarn build` for changes
that affect routing, generated content, PWA output, or deployment.

`next build` does not type-check because `next.config.ts` sets
`typescript.ignoreBuildErrors: true`. `yarn typecheck` is the only type gate.

---

## 4. Environment variables

`.env.example` is the committed template. `.env` is ignored and must never be
committed.

| Variable                    | Required               | Default                            | Purpose                                |
| --------------------------- | ---------------------- | ---------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Recommended            | `https://quotient.dev`             | Canonical URL for metadata and sitemap |
| `AUTH_SECRET`               | Yes for auth           | none                               | Auth.js JWT signing secret             |
| `AUTH_URL`                  | Production             | none                               | Canonical app URL                      |
| `AUTH_TRUST_HOST`           | Behind a proxy         | inferred                           | Trust the request host                 |
| `AUTH_GOOGLE_ID`            | Google sign-in         | none                               | Google OAuth client ID                 |
| `AUTH_GOOGLE_SECRET`        | Google sign-in         | none                               | Google OAuth client secret             |
| `RESEND_API_KEY`            | Magic links            | none                               | Resend API key                         |
| `EMAIL_FROM`                | Production magic links | `Quotient <onboarding@resend.dev>` | Verified Resend sender                 |
| `MAGIC_LINK_EXPIRY_MINUTES` | No                     | `15`                               | Link lifetime, capped at 60            |
| `DATABASE_URL`              | Yes for accounts       | none                               | PostgreSQL connection string           |

Generate a secret with:

```bash
openssl rand -base64 32
```

`auth.ts` trusts the host when `AUTH_TRUST_HOST` or `AUTH_URL` is set, when
running on Vercel or Cloudflare Pages, or outside production. In a custom
production deployment behind a reverse proxy, set both `AUTH_URL` and
`AUTH_TRUST_HOST=true`.

For Google OAuth, add the callback URL for your environment:

```text
http://localhost:3000/api/auth/callback/google
```

For magic links, the email callback is:

```text
http://localhost:3000/api/auth/callback/email
```

Magic-link emails need a verified `EMAIL_FROM` sender. The default Resend
onboarding address only delivers to the account owner, so it is not suitable
for real users.

---

## 5. Content workflow

Content is JSON under `content/`. The short version:

### Add or edit a lesson

1. Create `content/<category>/courses/<courseSlug>/<moduleSlug>/<lessonSlug>.json`.
2. Set `courseSlug`, `moduleSlug`, `slug`, `order`, `difficulty`,
   `estimatedMinutes`, and `blocks`.
3. Add the lesson slug to the module's `lessonSlugs` array in the module's
   `content.json`.
4. Run `yarn generate:content` (or start `yarn dev`).
5. Run `yarn test:content`.

### Add a module

1. Create `content/<category>/courses/<courseSlug>/<moduleSlug>/content.json`.
2. Add lesson JSON files and list them in `lessonSlugs`.
3. Add the module slug to the course's `moduleSlugs` array.
4. Give the module an explicit numeric `order`.
5. Regenerate indexes and run content tests.

### Add a course

1. Create `content/<category>/courses/<courseSlug>/content.json`.
2. Add modules and lessons.
3. List every module in `moduleSlugs` and give each module a numeric `order`.
4. Regenerate indexes. The category comes from the directory, so no sitemap
   edit is normally needed.

### Add a problem

Problems reuse the course/module/lesson model under
`content/<category>/problems/<courseSlug>/`. Register the lesson in the module
`content.json`; the generator discovers the problem course and stamps its URL
category. Run `yarn generate:content`.

### Add a cheat sheet

1. Create `content/<category>/cheatsheet/<technology>/content.json` (module
   metadata) and `cheatsheet.json` (lesson, slug `cheatsheet`).
2. Add the technology module slug to the section record in
   `content/cheatsheet.json`.
3. Regenerate indexes and run content tests.

Cheat-sheet `example` blocks are code-only: put the snippet in `code`, include a
correct `language`, and avoid duplicate examples.

### Add a question answer

1. Create
   `content/<category>/question-answers/<technology>/<questionSlug>.json`.
2. Set `courseSlug: "question-answers"`, `moduleSlug: "<technology>"`, and a
   display `technology` such as `"C#"`.
3. Add the question slug to the technology module's `lessonSlugs`.
4. Add the technology slug to `moduleSlugs` in
   `content/question-answers.json`.
5. Regenerate indexes and run content tests.

Use `getQuestionTechSlug()` from `lib/content-hrefs.ts` when converting a
display name to a URL segment (`C#` → `csharp`, `CI/CD Pipelines` →
`cicd-pipelines`).

### Add a roadmap

Edit `content/<category>/roadmaps/roadmap.json`. Steps reference existing
content by `kind` + `ref`, or use `kind: "link"` with an explicit `ref` and
`title` for pages such as `/ai/glossary`. Regenerate indexes. Invalid
references are omitted at render time, so run `yarn test:content` and inspect
the page.

### Add a glossary term or prompt

Glossary terms and prompts are **not** part of the generated index. Add the JSON
file, then register it manually in the matching barrel:

- `content/ai/glossary/<topic>/<slug>.json` → import and add to
  `rawGlossaryTerms` in `content/ai/glossary/index.ts`
- `content/ai/prompts/<topic>/<slug>.json` → import and add to the raw array in
  `content/ai/prompts/index.ts`

Then run `yarn typecheck` and `yarn test:content`.

### Generated files

Never edit these by hand:

```text
content/courses.ts
content/modules.ts
content/lessons.ts
content/categories.ts
content/roadmaps.ts
```

`yarn dev` and `yarn build` regenerate them through `predev` and `prebuild`.

---

## 6. Content validation

`yarn test:content` runs `scripts/test-content.ts`. It covers structural checks
for courses, modules, lessons, problems, cheat sheets, and question answers. It
does not fully validate every block shape, glossary term, prompt, roadmap, or
registration reference. Parse edited JSON yourself and inspect the affected
pages.

---

## 7. Authentication setup

Auth is configured in `auth.ts` with NextAuth v5:

- Google OAuth, scopes `openid profile email`, offline access, consent prompt;
- passwordless email magic links through Resend;
- Prisma Adapter;
- JWT sessions.

The API route is `app/api/auth/[...nextauth]/route.ts`. The magic-link POST is
throttled per IP (5 per 5 minutes) and per email (3 per 5 minutes).

Without `RESEND_API_KEY` in development, `lib/magicLink.ts` logs the sign-in link
to the server console instead of sending it. The UI still shows the same
“check your email” confirmation to avoid revealing whether an account exists.

Signed-out visitors can read all public content. They cannot persist progress,
bookmarks, notes, or an offline queue; actions show the inline `SignInPrompt`
instead of redirecting to `/login`.

---

## 8. Database workflow

The schema is `prisma/schema.prisma`; migrations are in
`prisma/migrations/`.

Local development:

```bash
yarn db:generate
yarn db:migrate
```

Inspect data:

```bash
yarn db:studio
```

Production and preview deployments:

```bash
yarn vercel-build
```

That script runs `prisma generate`, `prisma migrate deploy`, and the Next.js
build. If the database already has tables but no migration history, it marks the
existing migrations as applied before retrying the deploy.

To apply migrations without building:

```bash
yarn prisma migrate deploy
```

Never use `db:push` against production.

---

## 9. PWA testing

Service-worker registration is disabled in development by default. To test
installability:

```bash
NEXT_PUBLIC_ENABLE_PWA_DEV=true yarn dev
```

In PowerShell:

```powershell
$env:NEXT_PUBLIC_ENABLE_PWA_DEV = "true"; yarn dev
```

Mobile browsers require a secure context. `localhost` is allowed; a phone
opening `http://192.168.x.x:3000` is not installable unless served over HTTPS.

The manifest is `public/manifest.json`. PWA configuration lives in
`next.config.ts`. The app registers the service worker through
`components/ui/PWARegistration.tsx`.

---

## 10. Deployment

The expected platform is Vercel, using `yarn vercel-build`.

Production checklist:

1. Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and
   `AUTH_TRUST_HOST=true` (if behind a trusted proxy).
2. Set Google OAuth credentials and the production callback URL.
3. Set `RESEND_API_KEY` and a verified `EMAIL_FROM`.
4. Set `NEXT_PUBLIC_SITE_URL` to the canonical https URL.
5. Run migrations through the build.
6. Verify `/robots.txt`, `/sitemap.xml`, and one authenticated action.

Legacy `/dotnet/*` and `/cloud/*` URLs permanently redirect to `/backend/*` and
`/devops/*` from `next.config.ts`.

---

## 11. Troubleshooting

| Symptom                             | Check                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| New lesson or module is missing     | Run `yarn generate:content`; verify slug registration arrays                      |
| Content test passes but a page 404s | Category directory, `urlCategory`, and the slug parents                           |
| Type errors in content JSON         | Block `data` shape and required lesson/module fields                              |
| Prisma client missing               | `yarn db:generate`                                                                |
| Auth fails locally                  | `AUTH_SECRET`, `AUTH_URL`, Google callback URL, `DATABASE_URL`                    |
| Magic link not delivered            | `RESEND_API_KEY`, verified `EMAIL_FROM`; check server logs in development         |
| Every API mutation returns 400      | Missing `quotient_csrf` cookie/header; use `apiFetch`                             |
| Rate limits behave oddly            | Limits are in-memory per instance and reset on restart                            |
| PWA does not register               | `NEXT_PUBLIC_ENABLE_PWA_DEV=true`, secure context, production build               |
| Build is slow                       | Expected: the content graph is large; `serverMinification` is disabled on purpose |
