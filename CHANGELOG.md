# Changelog

All notable changes to Kanbi are recorded here.

This is the developer-facing record. A user-facing changelog is also rendered in
the product at `/changelog`, built from `src/lib/changelog-data.ts`. The two are
separate on purpose: this file carries engineering rationale and security detail
that should not be published, while the page carries only what a user of the
product can observe.

This file is reconstructed from Git history (`git log`, `git show`) and from the
`version` field in `package.json` at each commit. Dates are the author date of
the commit that introduced the change. No release tags exist in this repository,
so versions are recorded only where `package.json` declared one. Where a version
was not recorded, that is stated rather than guessed.

Current version: **3.2.0**

---

## 3.2.0

Date: 2026-09-30

Category: Correctness, security, and delivery

This release closes gaps that were present in 3.1.0 but invisible, because the
linter had not run and there was no continuous integration.

### Fixed

- **Board export produced empty documents.** The DOCX and PDF exporters grouped
  tasks by the display labels `To Do`, `In Progress`, and `Done`, while tasks are
  stored as `todo`, `wip`, and `done`. No task matched any group, so an exported
  board contained only its header. Both exporters now group by the stored
  values through a single `BOARD_TASK_COLUMNS` definition and render display
  labels separately.
- **Board export was not reachable.** `/api/boards/[id]/export` was fully
  implemented but the Settings panel showed "Coming Soon" and no other control
  called it. Export is now available from the Saved Boards page and from
  Settings, with loading and error states.
- **Board export was not scoped to the requesting user.** The route fetched a
  board by id through a service that used the browser Supabase client and did
  not filter by `user_id`. Ownership is now enforced in the query itself, and a
  board owned by another user returns the same not-found response as one that
  does not exist, so the endpoint cannot be used to discover valid ids.
- **Two definitions of the workload health score.** The score shown on the
  Overview and Autopilot pages was written inline in two components and could
  drift apart. It is now one tested function, `computeBoardHealthScore`, with the
  band thresholds and messages defined alongside it.
- **`/api/extract` accepted an unvalidated body.** The route checked
  `body.text?.trim()` by hand while sibling routes used Zod. It now uses
  `extractSchema`. A whitespace-only payload is now rejected as empty instead of
  passing the length check and reaching the model.
- **Saved board tasks were not validated.** `saveBoardSchema` declared tasks as
  `z.array(z.any())`, so the largest AI-shaped payload in the app was stored
  unchecked and later re-rendered. Tasks are now validated field by field with
  a per-board task cap.

### Security

- **Outbound URL fetching could reach internal services.** The URL import guard
  matched hostnames as strings. It did not resolve DNS, did not re-check
  redirect targets, and treated entries such as `10.` as prefixes rather than
  addresses, so a public name that resolved to a private address was fetched.
  Outbound fetches now validate the scheme, parse addresses with the platform IP
  parser, resolve every address and reject the request if any is private,
  reserved, or link-local, and follow redirects manually so every hop is
  re-validated. Covered by 46 tests including the rebinding and redirect cases.
- **The CSRF check admitted requests with no Origin and no Referer.** Any
  state-changing browser request now requires a same-origin signal. Webhook and
  cron paths are exempt by explicit allowlist because they authenticate by
  signature or bearer token rather than by origin.
- **Export filenames were built from an unvalidated title.** Filenames are now
  restricted to a safe character set, stripped of leading separators, and
  length-capped before being placed in a `Content-Disposition` header.
- **Internal error messages were returned to clients** on the URL import and
  board export routes, which can contain internal hostnames and database detail.
  Both now return a generic message and log the detail server side.
- **The avatar element could pull any host.** `next/image` was deliberately not
  used for user avatars, because a wildcard `remotePatterns` entry would let the
  image optimizer fetch any attacker-chosen URL. The reason is now recorded at
  the call site.

### Changed

- **Model selection is now driven by the live Groq catalog.** The previous
  implementation used a hardcoded preference list that still contained
  `gemma2-9b-it` and `mixtral-8x7b-32768`, both of which Groq has shut down, so
  the fallback path could select a dead model id. Selection now reads
  `models.list()`, excludes known-retired ids, excludes audio and moderation
  models, and checks each candidate's reported `max_completion_tokens` and
  `context_window` against what the request actually needs. `GROQ_MODEL` is now
  documented as the last-resort value used only when the catalog is unreachable.
- **Theme resolution no longer causes a cascading render.** The dashboard,
  landing, pricing, legal, and auth pages resolved their theme inside a
  `useEffect`, producing an extra render pass and a flash of the wrong theme.
  The dashboard, landing, and pricing pages now resolve it during the first
  client render. The auth layout uses `useSyncExternalStore`, which is the
  correct primitive for reading an external value that must not differ between
  the server and client render.
- **Icons declared during render were hoisted to module scope.** The sidebar
  button, the not-found page icons, and the landing and pricing icon factory all
  created new component types on every render, which discards subtree state and
  remounts the subtree. Icon factories now produce named components.
- **Internal links use `next/link`.** Six logo and navigation links used `<a>`
  for in-app routes, forcing a full page load.

### Added

- **URL task extraction is now reachable.** `/api/parse-url` existed with no
  client caller, while the README and pricing page advertised URL extraction. The
  Board page now has a URL input mode. Fetching happens on the server, so the
  SSRF protections apply and the page address is not exposed to third parties.
- **Continuous integration.** `.github/workflows/ci.yml` runs a frozen-lockfile
  install, lint, type check, tests, and build on every push and pull request to
  `main`. The lockfile check exists because an out-of-sync lockfile previously
  broke a Vercel deploy.
- **A working linter.** `next lint` was removed in Next.js 16, so `pnpm lint`
  failed outright and had never run. ESLint now runs through the CLI using the
  flat config that `eslint-config-next` ships.
- **A `typecheck` script**, wired to regenerate Next route types first so a
  removed route cannot leave stale generated types behind.

### Removed

Dead code with no caller and no replacement path, verified by searching the
client, tests, and configuration:

- Unused dependencies `framer-motion` and `date-fns`, which had zero imports.
- `src/lib/analytics.ts`, a console-based analytics stub with zero importers.
- `src/lib/services/board-service.ts` and `src/lib/services/realtime-service.ts`,
  both with zero importers. The board service was also the source of the
  ownership bug in the export route.
- Three unused functions in `src/lib/api/helpers.ts` that returned a
  hardcoded remaining count of 999.
- Five Zod schemas that no route used.
- `/api/generate-example`, which returned a hardcoded string and ignored its
  request body entirely.
- `/api/analytics`, `/api/subscription/status`, `/api/task-stats`,
  `/api/ai/status`, `/api/auth/signout`, `/api/autopilot/settings`, and
  `/api/feedback`. Each was superseded by a route the client already calls, or
  had no interface at all.
- Five empty directories under `src/app/api/integrations/google-calendar`, left
  behind when a Google Calendar integration was removed without cleaning up.
- Two test files that asserted on the raw text of `dashboard/page.tsx` via
  `readFileSync` and `toContain`. They asserted that a string existed, which
  proved nothing about behavior and broke on any refactor. The useful
  invariant, that the dashboard must not fake operations, is preserved as a
  fitness check that asserts only on forbidden patterns.

### Notes

- Infrastructure routes with no browser caller are retained deliberately:
  `/api/webhooks/stripe` and `/api/cron/cleanup` are called by Stripe and Vercel
  Cron, and `/api/keep-alive` and `/api/health` are operational endpoints.
- `src/app/api/ai/analyze-workload` and `src/app/api/ai/track-completion` remain
  without a client caller. The capacity model in `analyze-workload` is more
  detailed than the client health score and is documented as a known gap rather
  than wired up speculatively.

### Autopilot briefing, fixed

Generating a briefing failed with a generic error and the page fell back to the
error boundary. Three separate defects were involved.

1. **A task object was rendered as text.** The endpoint returns schedule blocks
   shaped as `{ start, end, task, duration }`, where `task` is the whole task and
   `duration` is a number of minutes. The dashboard read them as
   `{ time, task, duration }` and handed the object to React as a child, which
   throws. The response is now normalised through
   `src/lib/autopilot/normalize.ts`, which guarantees every rendered field is a
   string. `duration` now reads as `1h 30m` rather than `90`, and the time range
   is populated instead of blank.
2. **A normalised reply was never written back.** The normaliser was defined but
   not wired into the handler, so the same crash remained. The handler now
   assigns the normalised value.
3. **The engine ignored the estimate the user typed.** It only read a numeric
   `estimatedTime` field, which the dashboard does not send, so every task fell
   back to a default. The engine now parses values such as `1h`, `90m`, and
   `1h 30m`, and rejects a value it cannot read rather than scheduling it as
   zero length.

Two further defects were found by the new tests:

- **One oversized task emptied the rest of the day.** The scheduler stopped at
  the first task that did not fit, so a single three hour item pushed every
  smaller task out of the schedule. It now skips a task that does not fit and
  continues.
- **A negative estimate became positive.** The duration parser skipped a leading
  minus sign, so `-30m` parsed as thirty minutes. Leading signs are now rejected.

The briefing now also shows top priorities with a reason for each, every
warning rather than only the first, and the closing line. Burnout alerts are
persisted from the deterministic calculation, so the burnout panel is no longer
permanently empty.

### Chat

- Quick action shortcuts are now reachable. The server had supported them since
  they were written, but no control called them. They sit above the input and
  run entirely on the server, so none of them waits on a model.
- Common questions are answered deterministically. "What should I do first" is
  arithmetic over a list, so it is computed rather than generated, and the
  answer is instant and consistent.
- Messages were rebuilt as a component. Pasted multi line notes kept their line
  breaks instead of collapsing, long words wrap, the copy control is a labelled
  button reachable by keyboard, and links in a reply open safely.
- Error messages now say what happened and what to do, and the technical detail
  stays in the server log.
- All chat copy moved to `src/lib/ai/chat-copy.ts` so wording can be reviewed
  without touching control flow, and so a test can verify it.

### Punctuation

A single normaliser now handles dash punctuation, semicolons, invisible
characters, and whitespace. It chooses between a full stop and a comma based on
what follows the dash, so text reads naturally rather than merely passing a
check. It replaced a local helper that turned every em dash into a comma and
produced output like "a plan, and a review".

- Hyphenated compound words such as "follow-up" and "work-in-progress" are kept.
- A hyphen used as a dash becomes punctuation.
- The normaliser is enforced by a fitness check that parses every component with
  the TypeScript compiler and inspects the text nodes a person reads. CSS, HTTP
  headers, and regular expressions are excluded, because a semicolon is correct
  syntax in those.

### Templates

The starter templates moved to `src/lib/templates.ts` and were rewritten. Two
were added, Inbox Triage and Product Launch, bringing the set to eight. Each
carries a short description so the purpose is clear before it is used.

### Emoji replaced with drawn icons

Every emoji in the interface has been replaced with a drawn icon. Emoji render
differently on every platform, do not follow the theme colour, are announced by
screen readers at the wrong time, and fall back to a plain black box when a
colour emoji font is missing.

- The greeting wave, the success panel, the warning banners, and every arrow are
  now inline SVG that inherits the current colour.
- The six hand written error banners on the sign in, sign up, and reset password
  screens became one shared component, so they are identical and each carries a
  real `role="alert"`.
- The priority dots in exported DOCX and PDF files were emoji. They are now hex
  colours, and each export prints the priority as a word as well, so a printed
  page does not rely on colour alone.
- Warnings in the workload advice are plain sentences now.

A fitness check parses every component with the TypeScript compiler and fails
the build if an emoji reappears in visible text. It includes a self test, so a
change to the check that made it match nothing cannot pass silently.

### Fonts, fixed

The dashboard asked for a font family literally named `Geist`, which is not a
loaded font, so every heading on the dashboard silently fell back to the system
sans serif while the landing page used the real one. The three font variables now
reference the variables that `next/font` actually generates.

The application loads three families.

| Role | Family | Weight | Exposed as |
| --- | --- | --- | --- |
| Body and interface | Geist | 300 to 800 | `--font-geist` |
| Headings and display | Sora | 100 to 800 | `--font-sora` |
| Code and numbers | Geist Mono | 100 to 900 | `--font-geist-mono` |

Where each is used:

- `globals.css` sets the whole application. Body text uses Geist, every
  `h1` to `h6` uses Sora, and `code`, `pre`, `kbd`, and `samp` use Geist Mono.
- The dashboard maps these onto its own tokens. Body uses Geist, headings use
  Sora, and the monospace token is used for 28 places including times, counts,
  and version numbers.
- The landing page and pricing page set the body to Geist directly and rely on
  the global heading rule for display text.
- The changelog, privacy, and terms pages use the global stack unchanged.

### Colour contrast, measured and fixed

Four surfaces each carried their own copy of the colour palette. Four copies of a
dark background is not a design decision, it is four chances to pick a different
grey, and all four had drifted. Rather than judge the result by eye,
`__tests__/unit/contrast.test.ts` now computes the WCAG ratio for every text and
surface pair the product actually uses.

Seven pairs failed. The worst was the dashboard's muted token at **1.56 to 1**
against a card in dark mode. At that ratio the text is not text.

| Pair | Before | After |
| --- | --- | --- |
| Dashboard muted text on a card, dark | 1.56 to 1 | 4.56 to 1 |
| Landing muted text on a card, dark | 2.19 to 1 | 4.56 to 1 |
| Auth muted text on a card, dark | 2.27 to 1 | 4.56 to 1 |
| Muted text on a card, light | 3.39 to 1 | 4.57 to 1 |
| Secondary text on a card, dark | 4.41 to 1 | 4.59 to 1 |
| Changelog badges, light | 2.15 to 1 | 4.62 to 1 |
| Changelog badges, dark | 4.61 to 1 | 4.62 to 1 |

The middle text token had to move as well. Lifting only the muted tone to the
standard left it almost the same colour as the token below it, which trades a
contrast failure for an invisible hierarchy.

The four change categories were the worst case in the design: nine and a half
point uppercase text on a translucent tint of its own colour. Emerald, amber, and
red are fine as chart swatches and badly wrong as words. Each theme now supplies
its own set, and the badge tint is composited over the surface before measuring,
because a translucent background is not a colour you can hand to the formula.

The reference pairs in the checker are asserted first, so a change to the formula
that made it permissive would fail rather than silently approve everything.

### One palette, one theme rule

- `src/lib/theme.ts` is now the only place a colour is defined.
- The dashboard, the sign in screens, the landing page, the pricing page, the
  changelog, privacy, and terms all read it.
- **Pricing ignored the operating system preference entirely.** A visitor on a
  light system with no stored preference got the light theme on the landing page
  and dark on pricing. Two adjacent pages, opposite themes, no error.
- **Privacy and terms were pinned to a fourth palette**, a blue grey unrelated to
  the rest of the product, and had no theme control at all. Both now follow the
  site choice and carry a toggle.
- Choosing a theme in one tab now updates the others. The sign in screens had
  their own store that did not listen for cross tab changes.
- The dashboard was loading Geist from `fonts.googleapis.com` at runtime through
  a stylesheet import, even though `next/font` already ships the family with the
  build. That was a render blocking third party request on every dashboard load
  for no benefit. Removed.

A fitness check fails if any file outside `src/lib/theme.ts` defines the palette,
reads the theme key, or imports a font from a CDN. The check strips comments
first, because the first version of it flagged a paragraph of documentation and
that is the kind of false alarm that teaches people to disable a check.

### Changelog page, rebuilt

The public changelog page was dark only, narrower than the rest of the site, and
had no charts. It now:

- follows the site theme, keyed on the same stored value as every other page
- opens with five headline counts derived from the release notes
- carries three hand drawn SVG charts: commits per month, the shape of the
  codebase over time, and the mix of change categories
- shows every chart figure as a real table on request, so no number is available
  only as a picture
- labels each chart for a screen reader in words, and offers the same values on
  hover and on keyboard focus
- carries a built-with row of brand marks
- is checked at seven widths from 1440 to 320 in a real browser

No charting package was added. The work is two lines and six bars, and a package
would bring a dependency, a build step, and its own theme system to override.

**A chart lied, and the test caught it.** The per-month series ended with a point
carrying 83 commits, which is the cumulative total, not a month. It drew a bar
three times taller than any real month and the caption named it as the busiest
month. Monthly counts and snapshot counts are now separate series, and a fitness
check refuses to let a cumulative total into a per-month axis again.

### Brand icons

The footer used three generic line glyphs for GitHub, X, and LinkedIn. They are
now filled marks drawn from each brand's own geometry, in
`src/components/brand-icons.tsx`. A built-with row was added using marks for
Next.js, React, TypeScript, Tailwind CSS, Supabase, Groq, Stripe, and Vercel.

The pricing page copyright read 2025 and is now rendered from the current year
so it cannot go stale again.

### Removed

`/api/autopilot` was removed. It had no caller, called a model to decide whether
burnout risk existed, then wrote a hardcoded score of 40 into the alerts table.
A parse failure on malformed model output produced a 500, and the raw error
message was returned to the client. The deterministic engine already computes a
better answer without spending a request.

---

## 3.1.0

Date: 2026-03-15 (version bump in commit `e7cf1d1`)

Category: Release

The `package.json` version was raised to 3.1.0. The repository contains no tag
or release notes for this version, and the surrounding commits are titled
"Major Updates" and "Minor Fixes" without further detail, so the specific
changes in this version cannot be determined from the repository. The following
is recorded rather than invented.

## 3.0.0

Date: 2025-12-30 (version bump in commit `3437095`)

Category: Release

The version moved from `0.3.0` to `3.0.0`. No release notes exist for this
version in the repository.

## 0.3.0

Date: 2025-12-21 (version bump in commit `5afa24a`)

Category: Release

The version moved from `0.1.0` to `0.3.0`. No release notes exist for this
version in the repository.

## 0.1.0 and earlier

Dates: 2025-09-15 to 2025-11-02

Category: Development

Early development. The project started as a Kanban board, gained a
Groq-backed task extraction flow, then Supabase authentication and row level
security, and by December 2025 had 19 database tables and 21 API routes.

Version numbers before `0.1.0` were not recorded.

---

## Project history, reconstructed from the repository

### 2025-09 to 2025-11 — foundation

- Initial commit and first upload on 2025-09-15 at version `0.1.0`.
- A landing page, a Kanban board, and a Groq-powered task extraction flow.
- Supabase authentication and PostgreSQL with row level security.
- Version `0.1.0` throughout this period.

### 2025-12 to 2026-01 — product surface

- 2025-12-21, `0.1.0` to `0.3.0`.
- 2025-12-30, `0.3.0` to `3.0.0`.
- The API surface grew from 2 routes to 21, and the schema from 0 tables to 6.
- Stripe subscriptions, board export, and the analytics views were added.

### 2026-03 — the largest development month

- 37 of the repository's 83 commits, the highest activity by a wide margin.
- The version moved to `3.1.0` on 2026-03-15.
- API routes reached 36 and the schema reached 18 tables.
- The workload analyzer, autopilot engine, and AI chat were developed here.
- The dependency list fell from 42 to 28, indicating a deliberate consolidation.

### 2026-04 to 2026-09 — consolidation and deployment fixes

- 2026-04-12, deployment and Vercel configuration work.
- 2026-07-06, a lockfile was synced with `package.json` to fix a failed Vercel
  deploy. This is the exact failure the new CI lockfile check prevents.
- 2026-07-06, the GitHub Actions CI workflow was deleted. It had only run a
  build, and lint had been broken since the Next.js 16 upgrade.
- The source tree shrank from 17,581 lines in May 2026 to 13,656 by September,
  with the file count falling from 153 to 115, consistent with a large removal
  pass.
- 2026-09-21, the most recent commit before this release.

---

## Measured change over the project lifetime

All three series below are computed from Git, not estimated.

| Month    | Commits | Source files | Source lines | API routes | DB tables | Direct dependencies | Test files |
| -------- | ------- | ------------ | ------------ | ---------- | --------- | ------------------- | ---------- |
| 2025-09  | 8       | 67           | 4,635        | 0          | 0         | 42                  | 0          |
| 2025-11  | 3       | 90           | 7,836        | 2          | 0         | 42                  | 0          |
| 2025-12  | 7       | 62           | 4,700        | 2          | 0         | 42                  | 0          |
| 2026-01  | 5       | 118          | 10,981       | 21         | 6         | 42                  | 0          |
| 2026-02  | 1       | 118          | 10,981       | 21         | 6         | 42                  | 0          |
| 2026-03  | 37      | 145          | 16,387       | 36         | 18        | 28                  | 10         |
| 2026-04  | 9       | 150          | 17,482       | 36         | 18        | 28                  | 10         |
| 2026-05  | 4       | 153          | 17,581       | 38         | 18        | 28                  | 10         |
| 2026-06  | 0       | 153          | 17,581       | 38         | 18        | 28                  | 10         |
| 2026-07  | 5       | 111          | 13,115       | 32         | 18        | 36                  | 10         |
| 2026-08  | 3       | 113          | 13,256       | 32         | 18        | 36                  | 10         |
| 2026-09  | 1       | 115          | 13,656       | 32         | 19        | 37                  | 13         |
| 2026-09 (3.2.0) | 0 | 107 | 13,832 | 24 | 19 | 35 | 17 |

Methods:

- **Commits** per author date, from `git log`.
- **Source files and lines** are the count and total length of `.ts`, `.tsx`,
  `.js`, and `.jsx` files under `src/` and `app/` in the tree at the last commit
  of each month, via `git ls-tree` and `git show`.
- **API routes** are files matching `api/**/route.ts` in the same tree.
- **Database tables** are `CREATE TABLE` statements in `supabase/schema.sql`.
- **Direct dependencies** are entries in the `dependencies` object of
  `package.json`. The rise from 28 to 36 and 37 in mid-2026 reflects new runtime
  dependencies added after the March consolidation.
- **Test files** are files under `__tests__/`, `e2e/`, or matching `.test.`.

The 3.2.0 row is the state of this working tree, not a Git commit.

### What the three series teach

**Development activity is extremely uneven.** 37 of 83 commits landed in March
2026, and June 2026 has none. The project was built in a burst, not
incrementally. This is why documentation and tests lagged the code: the
capability curve rose far faster than the safety net around it.

**Capability grew much faster than the safety net.** The API surface went from
0 to 38 routes and the schema from 0 to 19 tables, while the first test file did
not appear until March 2026, in the same month the code was already at its
largest. Tests were added after the features they cover, not alongside them.

**The codebase shrank while the product did not.** Between May and September
2026 the tree lost 40 files and about 3,900 lines, and the API surface fell from
38 routes to 32. Version 3.2.0 continues that reduction to 24 routes and 35
dependencies. Removing unreachable code was a larger share of the work in this
release than adding new capability.

---

## How to reproduce every number in this file

Nothing here is an estimate. The commands are recorded so a reader can check any
claim rather than take it on trust.

```bash
# Versions and dates, from the tags and the package manifest.
git log --format='%ad %s' --date=short

# Commits per calendar month.
git log --format=%ad --date=format:%Y-%m | sort | uniq -c

# The tree as it stood at the last commit of a month.
git rev-list -1 --before="YYYY-MM-31 23:59" HEAD
git ls-tree -r --name-only <commit>

# Current counts.
find src -name '*.ts' -o -name '*.tsx' | grep -v '\.d\.ts' | wc -l   # source files
find src -name '*.ts' -o -name '*.tsx' | grep -v '\.d\.ts' \
  | xargs wc -l | tail -1                                           # lines of code
find src/app/api -name route.ts | wc -l                              # live routes
find . -path ./node_modules -prune -o -name '*.test.ts' -print \
  | wc -l                                                           # test files
pnpm test                                                            # assertions

# Colour contrast, which is a formula rather than an opinion.
pnpm test __tests__/unit/contrast.test.ts

# Punctuation and emoji fitness across every component.
pnpm test __tests__/unit/fitness.test.ts
```

## What the change counts mean

The figures in each release describe work that landed, not work that was
planned. A removal counts the same as an addition. Three of the recorded releases
carry no detailed notes because the repository has none for them, and the page
says so rather than inventing entries to fill the gap.
