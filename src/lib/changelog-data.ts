/**
 * Changelog content for the public /changelog page.
 *
 * This is the single source for the rendered page. The repository's CHANGELOG.md
 * is the developer-facing record and contains more detail, including the
 * engineering rationale and the measurement methodology.
 *
 * Entries describe changes a user of the product can observe. Security fixes are
 * summarised at a level that is useful without publishing exploit detail.
 */

export type ChangeKind = 'added' | 'fixed' | 'changed' | 'security' | 'removed';

export interface Change {
  kind: ChangeKind;
  text: string;
}

export interface Release {
  version: string;
  date: string;
  summary: string;
  changes: Change[];
}

export const CHANGELOG: Release[] = [
  {
    version: '3.2.0',
    date: '2026-09-30',
    summary:
      'Board export now works, the autopilot briefing no longer fails, the chat has working shortcuts, and the AI model is chosen from the live provider catalog instead of a hardcoded guess.',
    changes: [
      {
        kind: 'fixed',
        text: 'Generating an autopilot briefing failed with a generic error. The schedule was being read with the wrong field names, so the app tried to display a task object as text and the page crashed.',
      },
      {
        kind: 'fixed',
        text: 'The daily schedule ignored the time estimate you typed on a task. Values such as 1h or 90m are now understood, and an unreadable value is skipped rather than treated as zero.',
      },
      {
        kind: 'fixed',
        text: 'A single long task could empty the rest of your day. A task that does not fit in the remaining time is now skipped so the smaller ones still get scheduled.',
      },
      {
        kind: 'fixed',
        text: 'Exported boards were empty. The exporters grouped tasks by display labels while tasks are stored under different values, so nothing matched. Exports are grouped by column correctly now.',
      },
      {
        kind: 'fixed',
        text: 'Board export is now available. It was implemented but not linked to anywhere, and Settings showed a placeholder instead.',
      },
      {
        kind: 'fixed',
        text: 'The workload health score had two separate implementations that could disagree. There is now one, with the same result everywhere in the app.',
      },
      {
        kind: 'fixed',
        text: 'A pasted input of only spaces was accepted and sent to the AI model instead of being rejected as empty.',
      },
      {
        kind: 'fixed',
        text: 'Your plan limits shown in the app did not match the limits actually enforced. The app now displays the real values for your plan.',
      },
      {
        kind: 'security',
        text: 'Importing a web page URL could, in some cases, reach services on the internal network. Outbound requests now block private, reserved, and link-local addresses, including after a redirect.',
      },
      {
        kind: 'security',
        text: 'Board exports are now restricted to your own boards, and a board belonging to someone else behaves exactly like one that does not exist.',
      },
      {
        kind: 'security',
        text: 'Cross-site requests to the API are rejected unless they come from this site. Webhook and scheduled endpoints authenticate by their own signature or token and are unaffected.',
      },
      {
        kind: 'security',
        text: 'Internal error details are no longer sent to the browser on URL import and board export.',
      },
      {
        kind: 'changed',
        text: 'The AI model is now selected from the models your provider currently offers, matched to what each request needs. Models the provider has retired are never selected, and a request that needs a longer answer will not be sent to a model that cannot produce one.',
      },
      {
        kind: 'changed',
        text: 'The theme is applied on first paint instead of after a short flash of the wrong one.',
      },
      {
        kind: 'changed',
        text: 'The morning briefing now shows your top priorities with a reason for each, every warning rather than only the first, and the closing line.',
      },
      {
        kind: 'changed',
        text: 'Common chat questions are now answered directly from your board instead of being written by a model, so the answer is instant and always the same.',
      },
      {
        kind: 'changed',
        text: 'Navigation uses client side routing, so pages load faster and state is preserved.',
      },
      {
        kind: 'added',
        text: 'You can now paste a public web page URL on the Board page and extract tasks from it. The page is fetched on the server.',
      },
      {
        kind: 'added',
        text: 'Export now shows a clear error if it fails, instead of appearing to do nothing.',
      },
      {
        kind: 'added',
        text: 'Chat shortcut buttons for prioritise, break down, plan, defer, and motivate. Each one is computed on the server, so none of them waits on a model.',
      },
      {
        kind: 'added',
        text: 'Two new starter templates for inbox triage and product launch, bringing the set to eight.',
      },
      {
        kind: 'added',
        text: 'Every push and pull request now runs linting, type checks, and tests automatically, so a regression is caught before it reaches you.',
      },
      {
        kind: 'changed',
        text: 'Punctuation across the whole product is now consistent. No em dashes, no en dashes, and no semicolons, with real compound words such as follow-up left intact.',
      },
      {
        kind: 'changed',
        text: 'Every emoji has been replaced with a drawn icon that follows your theme. They looked different on every device, and vanished entirely on some.',
      },
      {
        kind: 'changed',
        text: 'Headings on the dashboard now use the same display font as the rest of the site. The dashboard had been falling back to a system font because of a typo in the font variable.',
      },
      {
        kind: 'added',
        text: 'The changelog now shows how the project has changed over time, with charts drawn from the repository history rather than from numbers someone typed in.',
      },
      {
        kind: 'added',
        text: 'Every chart on this page can be read as a plain table. Choose Show the numbers and the same figures appear as text, so nothing is available only as a picture.',
      },
      {
        kind: 'added',
        text: 'The changelog follows your light or dark choice now, and so do the landing and pricing pages. They each had their own copy of the setting and they disagreed.',
      },
      {
        kind: 'fixed',
        text: 'The muted grey used for dates, captions, and chart labels was too faint to read. It was below the 4.5 to 1 contrast standard in both themes, and the small category labels were worse.',
      },
      {
        kind: 'fixed',
        text: 'Choosing a theme in one browser tab now updates the others straight away instead of waiting for a reload.',
      },
      {
        kind: 'removed',
        text: 'Removed unused internal code and two unused libraries, which reduces the size of what ships to your browser.',
      },
    ],
  },
  {
    version: '3.1.0',
    date: '2026-03-15',
    summary:
      'Release recorded in the project manifest. The repository keeps no release notes for this version, so no further detail is claimed here.',
    changes: [],
  },
  {
    version: '3.0.0',
    date: '2025-12-30',
    summary:
      'Release recorded in the project manifest. The repository keeps no release notes for this version, so no further detail is claimed here.',
    changes: [],
  },
  {
    version: '0.3.0',
    date: '2025-12-21',
    summary:
      'Release recorded in the project manifest. The repository keeps no release notes for this version, so no further detail is claimed here.',
    changes: [],
  },
  {
    version: '0.1.0',
    date: '2025-09-15',
    summary:
      'First recorded version. The board, task extraction, and Supabase authentication were built in this period.',
    changes: [
      { kind: 'added', text: 'Kanban board with drag and drop columns.' },
      { kind: 'added', text: 'AI task extraction from pasted text.' },
      { kind: 'added', text: 'Supabase authentication and a PostgreSQL database with row level security.' },
    ],
  },
]

/** Presentational metadata for each change kind. */
/**
 * Display metadata for each change category.
 *
 * The colour is a theme token rather than a literal. The four brand colours
 * were fine as chart swatches and badly wrong as text: emerald, amber, and red
 * sat between 2.1 and 2.3 to 1 on a white page, and the badge is nine and a half
 * point uppercase. Each theme supplies its own set, both cleared against the
 * tint, by `__tests__/unit/contrast.test.ts`.
 */
export const KIND_META: Record<ChangeKind, { label: string; color: string; bg: string }> = {
  added: { label: 'Added', color: 'var(--kind-added)', bg: 'rgba(16,185,129,0.12)' },
  fixed: { label: 'Fixed', color: 'var(--kind-fixed)', bg: 'rgba(245,158,11,0.12)' },
  changed: { label: 'Changed', color: 'var(--kind-changed)', bg: 'rgba(99,102,241,0.12)' },
  security: { label: 'Security', color: 'var(--kind-security)', bg: 'rgba(239,68,68,0.12)' },
  removed: { label: 'Removed', color: 'var(--kind-removed)', bg: 'rgba(120,120,150,0.12)' },
}

/** Formats an ISO date for display, without depending on the viewer's locale. */
export function formatReleaseDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
