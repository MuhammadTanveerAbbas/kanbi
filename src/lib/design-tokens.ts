/**
 * The design tokens and the theme bootstrap.
 *
 * ## Why this is a separate module from `theme.ts`
 *
 * `theme.ts` is a `'use client'` module: it owns a React store and reads
 * `localStorage`. The root layout is a server component, and a server component
 * cannot invoke a function exported from a client module. When the layout tried
 * to, the build failed with
 *
 *   Attempted to call themeStyleSheet() from the server but themeStyleSheet is
 *   on the client.
 *
 * That is the correct diagnosis rather than an inconvenient one. The palette is
 * data, and the bootstrap script is a string. Neither needs a browser to exist,
 * and neither should be behind a client boundary. Everything in this file runs
 * on the server at build time and is also importable from the client, which is
 * what lets the head script and the React store agree on one source of truth.
 *
 * The split is by capability, not by convenience:
 *
 *   design-tokens.ts   pure data and pure functions, no browser, no React
 *   theme.ts           the client store that reads and writes the preference
 */

/** The two themes. */
export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'kanbi-theme'

/**
 * The theme a first-time visitor gets.
 *
 * Light, deliberately. A machine-level `prefers-color-scheme` is not a choice
 * the person using the site made, and following it meant a first visit on a
 * dark-configured laptop landed on a black page for a product that is otherwise
 * light. A visitor who has expressed a preference keeps it.
 */
export const DEFAULT_THEME: Theme = 'light'

const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light'

/**
 * The blocking script that runs before the body is parsed.
 *
 * It is the whole reason there is no flash: it reads one key and sets one
 * attribute, before the browser has painted anything. Kept as a literal string
 * rather than a runtime script tag so it can be asserted in a test, and kept
 * small so it is genuinely inline.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t!=="dark"&&t!=="light"){t=${JSON.stringify(
  DEFAULT_THEME
)}}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme=${JSON.stringify(
  DEFAULT_THEME
)}}})();`

/**
 * The palette, as a stylesheet, for both themes.
 *
 * Rendered once into the document head. Scoping by `[data-theme]` rather than
 * emitting only the active theme is what lets the head script above pick the
 * right one without re-rendering anything.
 */
export function themeStyleSheet(): string {
  return [
    // `:root` carries the default so that markup rendered without the attribute
    // set, such as a bfcache snapshot, is still light rather than unstyled.
    `:root,[data-theme='light']{${appThemeVars('light')}}`,
    `[data-theme='dark']{${appThemeVars('dark')}}`,
  ].join('\n')
}

/**
 * The CSS variable block for one theme, shared by every page that uses it.
 *
 * The three text tokens are spaced so they read as three distinct levels rather
 * than than three shades of the same grey.
 *
 * Every text token is solved against the *darkest* surface it can sit on, not
 * against the page background. `--bg3` is included because it is genuinely
 * painted: the dashboard skeleton gradient sweeps through it, and the donut
 * chart draws its track in it. Leaving it out is how `--tx3` ended up at 2.36
 * to 1 on a real surface while the test suite reported green.
 *
 * The middle token had to move as well. Bringing only the muted tone up to the
 * standard left it almost the same colour as the middle tone, so the two levels
 * became indistinguishable, which trades one defect for another. The separation
 * between the three is asserted alongside the contrast.
 *
 * Every pair here is checked by `__tests__/unit/contrast.test.ts`.
 *
 * The `kind` tokens are the changelog category colours. They are the worst case
 * in the design: nine and a half point uppercase text on a pale tint of its own
 * colour. The light mode values are much darker than the raw brand colours
 * because emerald, amber, and red all fail badly as small text on white. A
 * swatch drawn in the brand colour is fine at that size. A word is not.
 */
export function themeVars(theme: Theme): string {
  const neutrals =
    theme === 'dark'
      ? '--bg:#07070b;--bg1:#0d0d13;--bg2:#111119;--bg3:#16161f;--br:rgba(255,255,255,0.07);--brh:rgba(255,255,255,0.14);' +
        '--tx:#e0e0ea;--tx2:#9a9ab4;--tx3:#83839d;--inv:#fff;--inv2:#07070b;' +
        '--nb:rgba(7,7,11,0.88);' +
        '--kind-added:#11ba82;--kind-fixed:#f69f0c;--kind-changed:#797cff;--kind-security:#f35151;--kind-removed:#8989a5;'
      : '--bg:#f2f3fb;--bg1:#ffffff;--bg2:#eaebf8;--bg3:#e0e2f5;--br:rgba(0,0,0,0.07);--brh:rgba(0,0,0,0.14);' +
        '--tx:#0a0a18;--tx2:#4a4a72;--tx3:#63637e;--inv:#0a0a18;--inv2:#fff;' +
        '--nb:rgba(242,243,251,0.92);' +
        '--kind-added:#006c37;--kind-fixed:#9a4700;--kind-changed:#4649ce;--kind-security:#b51313;--kind-removed:#595976;'

  // The accents ship inside this block rather than beside it. Leaving them as a
  // separate string each page had to remember to add is exactly how the sign in
  // screens ended up with a button fill that resolved to nothing, which is
  // white writing on a white card.
  return neutrals + accentVars(theme)
}

/**
 * The application palette, which is the neutral tokens plus the extras the
 * dashboard and the sign in screens need.
 *
 * Those three surfaces each carried a full copy of the palette before. Three
 * copies of a dark background is not a design decision, it is three chances to
 * pick a different grey, and they did. The muted text on the dashboard measured
 * 1.6 to 1 against a card, which is not a colour, it is a suggestion.
 */
export function appThemeVars(theme: Theme): string {
  return (
    themeVars(theme) +
    (theme === 'dark'
      ? '--inp:#111119;--card:#0d0d13;--sb:#0a0a11;--sh:rgba(0,0,0,0.6);' +
        '--card-glow:rgba(94,111,232,0.05);--sidebar-border:rgba(255,255,255,0.055);' +
        '--inv:#fff;--inv2:#07070b;'
      : '--inp:#eaebf8;--card:#ffffff;--sb:#ffffff;--sh:rgba(0,0,0,0.08);' +
        '--card-glow:rgba(94,111,232,0.04);--sidebar-border:rgba(0,0,0,0.07);' +
        '--inv:#0a0a18;--inv2:#fff;')
  )
}

/**
 * Accent and status colours.
 *
 * One hue, used three ways, needed three values. A vivid indigo is right for a
 * gradient and wrong as small text, and it is worse still as a button fill with
 * white writing on it, because white on vivid indigo is 4.27 to 1.
 *
 * - `ac`, `ach` keep the brand hue for fills, strokes, and borders.
 * - `ac-text` is the hue darkened or lightened until it reads as text.
 * - `ac-solid` is the fill to use when white writing sits on top.
 * - `gr-text`, `am-text`, `rd-text`, `pu-text` are the status hues as text.
 *
 * The text tokens are solved against the tinted chip as well as the plain card.
 * A twelve percent accent wash over the darkest card is darker than the card
 * itself, so a token that clears the card can still miss inside a badge.
 *
 * Every one is asserted by `__tests__/unit/contrast.test.ts`.
 */
export function accentVars(theme: Theme): string {
  const base = '--ac:#5e6fe8;--ach:#6e7ff8;--as:rgba(94,111,232,0.12);--ag:rgba(94,111,232,0.22);'
  return theme === 'dark'
    ? base +
      '--ac-text:#7787f9;--ac-solid:#5162db;--ac-solid-h:#4257f0;' +
      '--gr:#22c55e;--am:#f59e0b;--rd:#ef4444;--pu:#a78bfa;' +
      '--gr-text:#22c55e;--am-text:#f59e0b;--rd-text:#f85858;--pu-text:#a78bfa;'
    : base +
      '--ac-text:#3b4bbc;--ac-solid:#5162db;--ac-solid-h:#3f4bbd;' +
      '--gr:#22c55e;--am:#f59e0b;--rd:#ef4444;--pu:#a78bfa;' +
      '--gr-text:#006b0a;--am-text:#974600;--rd-text:#ae0e0e;--pu-text:#6349b1;'
}

/* ────────────────────────────── Typography tokens ───────────────────────────
 *
 * One definition of what a font is, used by globals.css, by the Tailwind theme,
 * and by every page level stylesheet.
 *
 * Before this, eleven files each spelled out a font stack. Six of them named
 * `var(--font-geist)` with no fallback, four used a different fallback order,
 * and one named a literal family called "Geist" that is not a loaded font, so
 * every heading on that page silently rendered in the system sans serif. The
 * variables are the same, so the only thing that varied was whether a fallback
 * existed at all.
 */

/** Body and UI text. */
export const FONT_BODY = "var(--font-pt-sans), sans-serif"

/** Headings and anything meant to be read as a display face. */
export const FONT_DISPLAY = "var(--font-sora), sans-serif"

/** Code, tabular figures, and anything that must align in a column. */
export const FONT_MONO = "var(--font-pt-sans), sans-serif"

/** The variables the root layout binds on <body>. */
export const FONT_TOKENS = {
  '--font-display': FONT_DISPLAY,
  '--font-body': FONT_BODY,
  '--font-mono': FONT_MONO,
} as const
