# Quotient

Quotient is an open learning workspace for software engineers. It combines
structured courses, worked coding problems, interview questions, cheat sheets,
roadmaps, an AI glossary, and a prompt library in one installable web app.

Public content is readable without an account. Signing in adds progress,
bookmarks, notes, offline reading, and appearance preferences across devices.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS, NextAuth v5, and
PostgreSQL through Prisma.

---

## Quick start

Requirements: Node.js `>=20.9.0`, Yarn 1.22+, and PostgreSQL for account
features.

```powershell
yarn install
Copy-Item .env.example .env
yarn db:generate
yarn db:migrate
yarn dev
```

Open <http://localhost:3000>. Public content works without an account. Google
sign-in and email magic links need the auth variables; saved account data needs
a database connection.

---

## Documentation

| File                                                           | Read it for                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [AGENTS.md](./AGENTS.md)                                       | Repository contract for AI coding agents                                    |
| [agents/architecture.md](./agents/architecture.md)             | System design, routes, rendering, content pipeline, caching, deployment     |
| [agents/data-model.md](./agents/data-model.md)                 | Content schemas, block shapes, PostgreSQL tables, browser storage           |
| [agents/api.md](./agents/api.md)                               | Endpoint contracts, auth, CSRF, rate limits, payloads                       |
| [agents/development.md](./agents/development.md)               | Setup, commands, environment, content workflow, migrations, PWA, deployment |
| [agents/coding-conventions.md](./agents/coding-conventions.md) | TypeScript, server/client boundaries, React, styling, security              |
| [agents/ui-ux.md](./agents/ui-ux.md)                           | Visual system, layout, accessibility, copy                                  |
| [agents/content-author.md](./agents/content-author.md)         | Content author role                                                         |
| [agents/frontend-engineer.md](./agents/frontend-engineer.md)   | Frontend engineer role                                                      |
| [agents/reviewer.md](./agents/reviewer.md)                     | Code reviewer role                                                          |
| [agents/content-qa.md](./agents/content-qa.md)                 | Content QA role                                                             |

`AGENTS.md` is the repository-wide instruction file. If a role guide and
`AGENTS.md` disagree, follow `AGENTS.md` and update the role guide.
