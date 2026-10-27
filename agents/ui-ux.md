# UI/UX

Quotient is a learning workspace, not a marketing site. The interface should
make a dense curriculum feel navigable, keep reading comfortable for long
sessions, and be honest about what requires an account.

---

## 1. Experience principles

1. **Reading comes first.** Layout, contrast, and typography serve the lesson,
   not decorative chrome.
2. **Progressive disclosure.** Lead with the concept, then add nuance, examples,
   and trade-offs. Do not open with edge cases.
3. **One clear next step.** Every page should make the next lesson, section, or
   action obvious.
4. **Public by default, personal when signed in.** Anyone can read. Progress,
   bookmarks, notes, and offline saving require sign-in and prompt inline.
5. **Honest state.** Never imply progress is saved when it is not. Never hide a
   failed request behind a success message.
6. **Quiet confidence.** Avoid hype, gamification pressure, fake urgency, and
   condescending copy.
7. **Accessible by construction.** Keyboard, screen reader, reduced motion, and
   small screens are part of the default design.

---

## 2. Visual language

The palette is GitHub-inspired: warm neutral canvases, a blue accent, and
semantic status colors. Light and dark mode use the same semantic token names,
so components never branch on theme.

| Role | Tokens | Typical use |
| --- | --- | --- |
| Canvas | `bg-canvas`, `bg-canvas-subtle`, `bg-canvas-inset`, `bg-canvas-overlay` | Page, cards, code wells, modals |
| Text | `text-fg-default`, `text-fg-muted`, `text-fg-subtle`, `text-fg-onEmphasis` | Headings, body, metadata, inverse text |
| Borders | `border-border`, `border-border-muted`, `border-border-subtle` | Dividers, cards, inputs |
| Accent | `accent-fg`, `accent-emphasis`, `accent-muted`, `accent-subtle` | Links, active nav, primary actions |
| Success | `success-*` | Beginner difficulty, completion, tips |
| Attention | `attention-*` | Intermediate difficulty, warnings |
| Danger | `danger-*` | Errors, destructive actions, advanced danger callouts |
| Severe | `severe-*` | High-severity status where needed |
| Done | `done-*` | Advanced difficulty, completed states |

Rules:

- Use semantic tokens, never raw hex values in components.
- Use `cn()` from `lib/utils.ts` for conditional classes.
- Keep large surfaces calm. Reserve accent and status color for meaning.
- Prefer `rounded-lg` / `rounded-xl` and subtle borders over heavy shadows.
- Theme changes are global. Test every new surface in both modes.

### Difficulty color mapping

| Difficulty | Classes |
| --- | --- |
| Beginner | `bg-success-muted text-success-fg border-success-muted` |
| Intermediate | `bg-attention-muted text-attention-fg border-attention-muted` |
| Advanced | `bg-done-muted text-done-fg border-done-muted` |

The shared `DifficultyBadge` uses this mapping. Do not introduce a second
difficulty palette.

---

## 3. Typography and appearance

- The app loads Inter through `next/font/google` and applies it to `<html>`.
- Body size is controlled by `--font-size-body`; code size by
  `--font-size-code`.
- Long-form lesson content uses the `.lesson-prose` styles in `app/globals.css`,
  not ad-hoc typography classes inside content components.
- Headings use tight tracking and a clear hierarchy. Do not skip levels.
- Code uses the project mono stack and `react-shiki` highlighting.

### Appearance preferences

Stored in `UserPreference` and mirrored to browser storage/cookies:

| Preference | Supported values | Default |
| --- | --- | --- |
| Font size | `sm`, `md`, `lg`, `xl` | `md` (1rem) |
| Code font size | `sm`, `md`, `lg` | theme default (`0.875rem`) |
| Density | `comfortable`, `compact` | unset |
| Reduced motion | boolean | `false` |
| Auto-expand code | boolean | `true` |
| Show completed | boolean | `true` |
| Default landing | string or `null` | `null` |

Appearance classes are applied to `<html>`:

```text
font-size-sm | font-size-md | font-size-lg | font-size-xl
font-size-code-sm | font-size-code-md | font-size-code-lg
density-comfortable | density-compact
reduced-motion
```

Density sets `--content-padding` to `1.5rem` (comfortable) or `0.75rem`
(compact); components that should respond to density must consume that
variable. Reduced motion sets `--transition-duration` to `0ms` and respects the
OS `prefers-reduced-motion` setting.

A blocking script in the root layout applies the cookie mirror before first
paint. Do not replace it with an effect-only implementation; that causes a
visible font-size flash.

---

## 4. Layout and responsive behavior

### App shell

```text
SkipLink
Header (sticky, brand, category nav, search, theme/user controls)
Main
└── page content, wrapped in an error boundary
Footer (brand + outbound links only)
OfflineIndicator
```

The header becomes translucent with a blur after scrolling. It is sticky at the
top and must remain keyboard reachable. The footer is intentionally minimal; do
not add content columns.

### Breakpoints

| Width | Behavior |
| --- | --- |
| Base / mobile | Single column, mobile menu, compact cards, lesson controls above content |
| `sm` (640px) | Wider padding, more multi-column card grids |
| `md` (768px) | Two-column content cards where the content supports it |
| `lg` (1024px) | Course sidebar and account sidebar appear; mobile lesson controls hide |
| `xl` (1280px) | Full category navigation and the right-hand lesson TOC appear |

The primary reading column is capped around `800px` on lesson pages so line
length stays comfortable. Do not stretch prose to the full viewport.

### Lesson page

```text
Breadcrumbs
Header: actions, h1, description, tags
Mobile: progress + contents drawer (below lg)
Content blocks
Further reading
Previous / next lesson links
Related lessons
Desktop: left course sidebar (lg+), right progress + TOC (xl+)
```

- The left sidebar and right TOC are sticky and independently scrollable.
- Previous/next links sit at the end of the article and align with the reading
  column, not the viewport edges.
- The mobile progress/contents control replaces both sidebars below `lg`.
- Lesson titles may wrap; never truncate the `h1`. Previous/next labels use
  `line-clamp-1`.

### Account area

`/user/*` uses a centered `max-w-6xl` shell with a page header, a vertical
account sidebar at `lg+`, and the page content in the remaining column. The
sidebar is hidden below `lg`; the header user menu remains the account
navigation on small screens. Keep account sections in this order:

`Profile → Personalization → Progress → Bookmarks → Notes → Saved offline →
Danger Zone`.

---

## 5. Content presentation

### Section headers

Use `SectionHeader` for consistent hierarchy:

```text
eyebrow (uppercase, accent, small)
title (h1/h2/h3, bold)
description (muted, max-width)
```

`eyebrow → heading → description` is the established rhythm. Do not add a
competing kicker or badge above it.

### Lesson body

- Paragraphs stay readable and moderately short.
- Headings map to `h2`, `h3`, and `h4`; the page owns the `h1`.
- Use `bullet-list` for scannable points and `numbered-list` only for sequence.
- Tables are for comparison and reference, not for long prose.
- Use a `callout` for a single important aside. `role="note"` is already applied.
- Every callout variant has meaning:
  - `info`: context;
  - `tip`: practical advice;
  - `note`: neutral clarification;
  - `warning`: something that can go wrong;
  - `important`: a must-not-miss constraint;
  - `danger` / `error`: destructive or failure states.
- Use `summary-box` for the takeaway and `faq-block` for recurring questions.
  Do not use either as a generic container.
- Use `comparison-cards` only when the reader must choose between options.
- Use `divider` sparingly; spacing already separates sections.

### Difficulty and time

- Show `DifficultyBadge` and reading/working time where they help planning.
- Do not use difficulty as a proxy for quality or importance.

---

## 6. Navigation

- The top nav is generated from content. Categories list only the sections that
  exist.
- Desktop category menus open on click, expose `aria-expanded`, and close on
  outside click or Escape.
- Mobile navigation is an accordion; keep the same order and labels as desktop.
- Breadcrumbs appear on course, problem, cheat-sheet, and question pages.
- The lesson sidebar shows module and lesson order, current location, and
  completion state.
- The TOC tracks the active heading and links to stable anchors.
- The `AI` category adds static `Glossary` and `Prompt Templates` entries.
- `fundamentals` content is browsable by URL but hidden from the nav.

Do not hardcode category lists in components. Add metadata in `lib/content.ts`
and let the content tree drive the nav.

---

## 7. Feedback and states

| State | Pattern |
| --- | --- |
| Loading | Skeletons or route-level `loading.tsx`; avoid full-page spinners |
| Empty | `EmptyState` with a clear explanation and next action |
| Error | Friendly boundary with retry or a link back; never a raw stack trace |
| Search empty | Explain what was searched and suggest broader terms |
| Offline | `OfflineIndicator` banner; keep reading available |
| Save failure | Inline error near the action; do not show a success toast |
| Signed out | Inline `SignInPrompt`; do not redirect away from content |
| Destructive action | Explicit confirmation naming exactly what will be deleted |

Toasts are not a substitute for persistent state. If an action changes saved
data, the surrounding UI must reflect the new state after success.

---

## 8. Account and sign-in UX

- `/login` offers Google and email magic-link sign-in in one calm card.
- The email flow always shows the same “check your email” confirmation, whether
  or not the address has an account. Do not reveal account existence.
- Sign-in errors route to `/login/error` with human-readable copy.
- `/user/*` is protected by the shared layout and redirects to `/login`.
- Account pages use summary cards and lists, not dense tables.
- The danger zone names the data group and the consequence before deleting.
- Personalization changes apply immediately and are announced where needed.

Signed-out users can still read every public page. Bookmarking, completing a
lesson, writing notes, and saving offline should surface `SignInPrompt` inline.

---

## 9. Accessibility

### Required

- Semantic landmarks: one `main`, labeled `nav` elements, `header`, `footer`,
  `article` for lessons.
- Skip link to `#main-content`.
- Visible focus indicators on every interactive element.
- Icon-only buttons have `aria-label`.
- Menus and drawers expose `aria-expanded` / `aria-controls`.
- Active navigation uses `aria-current="page"`.
- Modals trap focus, restore focus on close, close on Escape, and lock body
  scroll.
- Images have `alt`; decorative icons use `aria-hidden="true"`.
- Callouts use `role="note"`.
- Dynamic status messages use a polite live region.
- Color is never the only signal; pair it with text or an icon.
- Text and controls meet contrast requirements in both themes.
- Motion respects `prefers-reduced-motion` and the reduced-motion preference.
- Touch targets are comfortably sized on mobile.

### Keyboard expectations

- Tab order follows the visual order.
- The mobile menu and category dropdowns close with Escape.
- Search is reachable and dismissible without a mouse.
- Lesson previous/next links and the TOC are fully keyboard operable.
- Do not add positive `tabIndex` values.

### Keyboard shortcuts

Global shortcuts are registered in `hooks/useKeyboardShortcuts.tsx`. The help
dialog opens with `?` or from **Keyboard shortcuts** in the profile menu.

| Keys | Action |
| --- | --- |
| `n` | Go to the next lesson |
| `p` | Go to the previous lesson |
| `/` | Open and focus search |
| `?` | Toggle the keyboard shortcuts help |
| `Escape` | Close a dialog, search, or category menu |
| `c` | Mark the current lesson complete or incomplete |
| `b` | Add or remove the current lesson bookmark |
| `o` | Open lesson notes |
| `s` | Save or remove the current lesson offline |
| `t` | Toggle light and dark theme |
| `+` / `-` / `0` | Zoom in, zoom out, or reset an open image or diagram |
| `g` then `h` | Go home |
| `g` then `b` | Go to bookmarks |
| `g` then `p` | Go to progress |

Single-key shortcuts are disabled while the user is typing in a field. Shortcuts
that act on a lesson are only registered on lesson, problem, cheat-sheet, and
question-answer pages.

---

## 10. Copy and tone

- Write for a smart reader who is new to the topic.
- Define a term the first time it appears; link to the glossary when useful.
- Prefer concrete verbs and short sentences.
- Say what a thing is for, not just what it is called.
- Avoid “simply”, “just”, “obviously”, and “as everyone knows”.
- Avoid hype and guarantees. Do not promise a job, salary, or interview outcome.
- Distinguish facts from recommendations.
- Keep error messages actionable: what happened, what to do next.
- Keep empty states useful: why it is empty and how to fill it.
