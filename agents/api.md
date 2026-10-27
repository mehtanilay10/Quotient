# API Reference

All application endpoints live under `app/api/`. They return JSON. Public
content pages do not call the API for content; they read the bundled content
graph on the server. The API exists for search, Auth.js, and authenticated user
state.

---

## 1. Conventions

### Base URL

Use the same origin as the app (for example `http://localhost:3000`). There is
no `/api/v1` prefix and no API versioning layer.

### Authentication

Every authenticated route is wrapped by `createApiAuthHandler`. It:

1. applies a 60-request/minute per-IP pre-auth limit;
2. reads the Auth.js session;
3. for non-GET requests, validates CSRF;
4. resolves or creates the Prisma `User` row;
5. calls the handler with the database user.

Unauthenticated requests return `401` with code `AUTH_ERROR`.

### CSRF

Authenticated responses set a non-`httpOnly` `quotient_csrf` cookie. Mutating
requests must send the same value in the `x-csrf-token` header. Client code
should use `apiFetch` from `lib/apiFetch.ts`, which attaches the header
automatically.

A missing or mismatched token returns `400` with code `VALIDATION_ERROR` and a
fresh CSRF cookie. Because the token is delivered by a response, a client should
make an authenticated GET before its first mutation.

### Rate limits

Limits are per client IP and per route, using an in-memory sliding window. They
are per server instance, not a global quota. Exceeding a limit returns:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again later."
}
```

### Errors

Authenticated handlers return a consistent shape:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid progress payload",
  "details": []
}
```

`details` is present only for Zod validation failures and contains the issue
list. Common codes and statuses:

| Code | Status | Meaning |
| --- | --- | --- |
| `AUTH_ERROR` | 401 | No session |
| `VALIDATION_ERROR` | 400 | Invalid body, query, CSRF token, or unknown reset target |
| `RATE_LIMITED` | 429 | Limit exceeded |
| `DATABASE_ERROR` | 500 | Query or persistence failure |
| `NETWORK_ERROR` | 503 | Defined for network failures; used by client-side error classification |

---

## 2. Endpoint summary

| Method | Path | Auth | Handler limit |
| --- | --- | --- | --- |
| `GET` / `POST` | `/api/auth/[...nextauth]` | Public | 5 magic links / 5 min per IP; 3 / 5 min per email |
| `GET` | `/api/search?q=` | Public | 20 / min |
| `GET` | `/api/progress` | Required | pre-auth only |
| `POST` | `/api/progress` | Required + CSRF | 30 / min |
| `DELETE` | `/api/progress` | Required + CSRF | 10 / min |
| `GET` | `/api/bookmarks` | Required | pre-auth only |
| `POST` | `/api/bookmarks` | Required + CSRF | 30 / min |
| `DELETE` | `/api/bookmarks` | Required + CSRF | 10 / min |
| `GET` | `/api/last-path` | Required | pre-auth only |
| `POST` | `/api/last-path` | Required + CSRF | 30 / min |
| `GET` | `/api/user/theme` | Required | pre-auth only |
| `POST` | `/api/user/theme` | Required + CSRF | 10 / min |
| `GET` | `/api/user/preferences` | Required | pre-auth only |
| `POST` | `/api/user/preferences` | Required + CSRF | 30 / min |
| `GET` | `/api/user/notes` | Required | pre-auth only |
| `POST` | `/api/user/notes` | Required + CSRF | 30 / min |
| `DELETE` | `/api/user/notes` | Required + CSRF | 10 / min |
| `GET` | `/api/user/offline-queue` | Required | pre-auth only |
| `POST` | `/api/user/offline-queue` | Required + CSRF | 20 / min |
| `DELETE` | `/api/user/offline-queue` | Required + CSRF | 10 / min |
| `GET` | `/api/user/account-summary` | Required | pre-auth only |
| `DELETE` | `/api/user/account-reset` | Required + CSRF | 5 / min |

All limits are in addition to the 60-request/minute pre-auth throttle.

---

## 3. Auth.js

### `GET|POST /api/auth/[...nextauth]`

Handled by NextAuth v5 (`auth.ts`). Google OAuth and email magic-link routes,
callbacks, session, CSRF, and sign-out all live here. The app does not
reimplement them.

The `POST` handler is wrapped only to throttle `/signin/email` before Auth.js
creates a token. On a limit, it returns `429` with a JSON body shaped for
`signIn(..., { redirect: false })`:

```json
{
  "url": "http://localhost:3000/login/error?error=RateLimited"
}
```

A magic-link request is limited to **5 per 5 minutes per IP** and **3 per 5
minutes per email**. Email comparison is case-insensitive.

The email itself is sent by `lib/magicLink.ts` through Resend’s HTTP API. The
link lifetime comes from `MAGIC_LINK_EXPIRY_MINUTES` (default 15, capped at 60).
Without `RESEND_API_KEY` in development, the link is logged to the server
console instead.

---

## 4. Search

### `GET /api/search?q=<query>`

Public, case-insensitive search across lessons, modules, courses, and cheat
sheets. The query is trimmed; an empty query returns an empty list.

**Limit:** 200 characters, 20 requests/minute per IP.

**Response**

```json
{
  "results": [
    {
      "type": "lesson",
      "slug": "tokens-explained",
      "title": "Tokens Explained",
      "description": "Why AI models count tokens instead of words.",
      "courseSlug": "ai-basics",
      "moduleSlug": "understanding-llms",
      "difficulty": "beginner",
      "tags": ["tokens", "context-window"],
      "technology": null,
      "score": 142,
      "matchField": "title",
      "snippet": "Tokens Explained"
    }
  ]
}
```

`type` is `lesson`, `module`, `course`, or `cheatsheet`. `matchField` is
`title`, `description`, or `tag`. `score` is an internal relevance score; higher
is better. `snippet` is a description excerpt around the strongest match.

**Errors**

| Status | Code | Cause |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Query exceeds 200 characters |
| `429` | `RATE_LIMITED` | More than 20 requests in a minute |

Search is computed in process by `searchAll()`; it does not query PostgreSQL.

---

## 5. Progress

Progress is bucketed by `category`: `lessons`, `problems`, or
`questionAnswers`.

### `GET /api/progress`

Returns all progress rows for the signed-in user, grouped by category and newest
first.

**Response**

```json
{
  "progress": {
    "lessons": [
      {
        "lessonSlug": "what-is-csharp",
        "moduleSlug": "getting-started",
        "completedAt": "2026-10-24T09:12:00.000Z",
        "title": "What is C#",
        "href": "/backend/courses/csharp-fundamentals/getting-started/what-is-csharp",
        "estimatedMinutes": 35
      }
    ],
    "problems": [],
    "questionAnswers": []
  }
}
```

The handler resolves canonical category-prefixed hrefs and lesson titles on the
server. Missing categories are omitted from the object.

### `POST /api/progress`

Marks one or more items complete. Duplicate completions are ignored.

**Body — batch**

```json
{
  "entries": [
    {
      "category": "lessons",
      "lessonSlug": "what-is-csharp",
      "moduleSlug": "getting-started"
    }
  ]
}
```

**Body — single entry**

```json
{
  "category": "lessons",
  "lessonSlug": "what-is-csharp",
  "moduleSlug": "getting-started"
}
```

`entries` is optional in the schema, but the single-entry fallback is validated
against the same `ProgressEntrySchema`. Batch arrays are capped at 1000 entries.
Slugs are 1–200 characters.

**Response:** `{ "ok": true }`

### `DELETE /api/progress`

Deletes **all** progress rows for the signed-in user. There is no single-row
delete endpoint.

**Response:** `{ "ok": true }`

---

## 6. Bookmarks

A bookmark has a `type` (`lesson`, `problem`, `questionAnswer`, `cheatsheet`)
and a content slug.

### `GET /api/bookmarks`

Returns bookmarks newest first.

**Response**

```json
{
  "items": [
    {
      "id": "a3f1c2d4-...",
      "type": "lesson",
      "slug": "what-is-csharp",
      "title": "What is C#",
      "courseSlug": "csharp-fundamentals",
      "moduleSlug": "getting-started",
      "addedAt": "2026-10-24T09:12:00.000Z"
    }
  ]
}
```

### `POST /api/bookmarks`

Adds one or more bookmarks. Duplicate `(type, slug)` pairs are ignored.

**Body — batch**

```json
{
  "items": [
    {
      "type": "lesson",
      "slug": "what-is-csharp",
      "title": "What is C#",
      "courseSlug": "csharp-fundamentals",
      "moduleSlug": "getting-started"
    }
  ]
}
```

**Body — single item**

```json
{
  "type": "lesson",
  "slug": "what-is-csharp",
  "title": "What is C#",
  "courseSlug": "csharp-fundamentals",
  "moduleSlug": "getting-started"
}
```

`title` is capped at 300 characters and slugs at 200. Batch arrays are capped at
1000 items.

**Response:** `{ "ok": true }`

### `DELETE /api/bookmarks`

Delete one bookmark:

```json
{
  "slug": "what-is-csharp",
  "type": "lesson"
}
```

Or clear every bookmark:

```json
{ "all": true }
```

**Response**

```json
{ "ok": true, "deleted": 1 }
```

`deleted` is `0` when nothing matched.

---

## 7. Last visited path

Used by `ContinuePrompt` for signed-in users. Signed-out visitors use
`localStorage` instead.

### `GET /api/last-path`

```json
{ "path": "/backend/courses/csharp-fundamentals/getting-started/what-is-csharp" }
```

`path` is `null` when the user has no saved path.

### `POST /api/last-path`

**Body**

```json
{ "path": "/backend/courses/csharp-fundamentals/getting-started/what-is-csharp" }
```

`path` is required and capped at 2000 characters. The row is upserted, so there
is one path per user.

**Response:** `{ "ok": true }`

---

## 8. Theme

### `GET /api/user/theme`

```json
{ "theme": "system" }
```

Returns `system` when no row exists. Valid values are `light`, `dark`, and
`system`.

### `POST /api/user/theme`

**Body**

```json
{ "theme": "dark" }
```

**Response:** `{ "ok": true }`

**Limit:** 10 requests/minute.

---

## 9. Personalization preferences

### `GET /api/user/preferences`

Returns the user’s appearance and behavior preferences with defaults applied.

```json
{
  "fontSize": null,
  "density": null,
  "codeFontSize": null,
  "reducedMotion": false,
  "autoExpandCode": true,
  "showCompleted": true,
  "defaultLanding": null
}
```

### `POST /api/user/preferences`

Send any subset of the fields. Unknown keys are ignored. At least one valid
field is required.

```json
{
  "fontSize": "lg",
  "density": "compact",
  "codeFontSize": "md",
  "reducedMotion": true,
  "autoExpandCode": false,
  "showCompleted": true,
  "defaultLanding": "/user/progress"
}
```

The handler validates boolean fields as booleans and string fields as strings or
`null`. It does **not** validate that font/density/landing values are supported
options; the UI is responsible for that. The response is the full updated
preference object, in the same shape as `GET`.

**Limit:** 30 requests/minute.

---

## 10. Lesson notes

### `GET /api/user/notes`

Returns notes newest first, with the lesson title and canonical href resolved on
the server.

```json
{
  "notes": [
    {
      "courseSlug": "csharp-fundamentals",
      "moduleSlug": "getting-started",
      "lessonSlug": "what-is-csharp",
      "content": "Review value types before the next module.",
      "updatedAt": "2026-10-24T09:12:00.000Z",
      "title": "What is C#",
      "href": "/backend/courses/csharp-fundamentals/getting-started/what-is-csharp"
    }
  ]
}
```

`courseSlug` is stored on the note row, so it is the deciding scope for the
content lookup.

### `POST /api/user/notes`

**Body**

```json
{
  "courseSlug": "csharp-fundamentals",
  "moduleSlug": "getting-started",
  "lessonSlug": "what-is-csharp",
  "content": "Review value types before the next module."
}
```

`content` must be 1–50,000 characters. Saves are upserts on
`(user, course, module, lesson)`.

**Response:** `{ "ok": true }`

### `DELETE /api/user/notes`

**Body**

```json
{
  "courseSlug": "csharp-fundamentals",
  "moduleSlug": "getting-started",
  "lessonSlug": "what-is-csharp"
}
```

**Response**

```json
{ "ok": true, "deleted": 1 }
```

---

## 11. Offline reading queue

This queue stores lessons the user wants available offline. It is separate from
the service worker cache.

### `GET /api/user/offline-queue`

```json
{
  "queue": [
    {
      "courseSlug": "csharp-fundamentals",
      "moduleSlug": "getting-started",
      "lessonSlug": "what-is-csharp",
      "title": "What is C#",
      "queuedAt": "2026-10-24T09:12:00.000Z"
    }
  ]
}
```

### `POST /api/user/offline-queue`

Batch:

```json
{
  "entries": [
    {
      "courseSlug": "csharp-fundamentals",
      "moduleSlug": "getting-started",
      "lessonSlug": "what-is-csharp",
      "title": "What is C#"
    }
  ]
}
```

A single item object is also accepted. Batch arrays are capped at 500 entries;
duplicates are ignored.

**Response:** `{ "ok": true }`

**Limit:** 20 requests/minute.

### `DELETE /api/user/offline-queue`

**Body**

```json
{
  "courseSlug": "csharp-fundamentals",
  "moduleSlug": "getting-started",
  "lessonSlug": "what-is-csharp"
}
```

**Response**

```json
{ "ok": true, "deleted": 1 }
```

---

## 12. Account summary

### `GET /api/user/account-summary`

Returns account metadata and item counts for the profile page. It is a dedicated
endpoint so the page does not load every row just to count them.

```json
{
  "createdAt": "2026-09-14T07:18:24.000Z",
  "emailVerified": "2026-09-14T07:20:00.000Z",
  "counts": {
    "progress": 42,
    "bookmarks": 7,
    "notes": 3,
    "offlineQueue": 5
  }
}
```

`createdAt` and `emailVerified` are ISO strings or `null`.

---

## 13. Account reset

### `DELETE /api/user/account-reset`

Deletes one data group for the signed-in user. Account identity, theme, and
personalization preferences are preserved.

**Body**

```json
{ "target": "progress" }
```

Valid targets:

| Target | Deletes | Cache cleared |
| --- | --- | --- |
| `progress` | All `user_progress` rows | `progress:<userId>` |
| `bookmarks` | All `user_bookmarks` rows | `bookmarks:<userId>` |
| `notes` | All `user_lesson_notes` rows | none |
| `offline` | All `offline_reading_queue` rows | none |

**Response:** `{ "ok": true }`

**Limit:** 5 requests/minute.

This endpoint does not delete the user or their Auth.js accounts.
