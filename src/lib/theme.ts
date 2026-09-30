'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Site theme store.
 *
 * The landing page, pricing page, and this changelog all need to read and write
 * the same value. Three copies of the same `useEffect` plus `localStorage` code
 * meant three places to forget the system preference, which is exactly what
 * happened. The changelog page stayed dark no matter what the visitor chose
 * anywhere else.
 *
 * This is the single source for it.
 *
 * Reading the stored value during render is what makes it correct rather than a
 * guess, so the server snapshot is always "light" and the real value arrives on
 * the first client render. `useSyncExternalStore` handles that handoff without
 * the hydration warning that a lazy `useState` initializer produces here.
 *
 * A visitor who has never chosen gets the operating system preference and keeps
 * following it. A visitor who has chosen keeps their choice, and a change to the
 * system setting no longer overrides it.
 */

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'kanbi-theme'

/** Used on the server, and as the value before the client has read storage. */
const SERVER_SNAPSHOT: Theme = 'light'

function read(): Theme {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    // Private browsing can make localStorage throw on read. The system
    // preference is a perfectly good answer in that case.
    return SERVER_SNAPSHOT
  }
}

/**
 * Read once, as soon as this module is evaluated in a browser.
 *
 * Doing it here rather than in an effect matters. `useSyncExternalStore` calls
 * `getSnapshot` during the first render, so a value assigned later in an effect
 * arrives one paint late and any test that reads the theme straight after load
 * sees the default. That was the first version of this file and the toggle
 * looked broken because of it.
 */
let current: Theme = read()
const listeners = new Set<() => void>()

function publish(): void {
  for (const listener of listeners) listener()
}

/**
 * Syncs the in memory value with storage and the system preference.
 *
 * Called once from the provider. It deliberately does not set React state
 * directly, it updates the store and lets subscribers re-read.
 */
export function startThemeWatch(): () => void {
  if (typeof window === 'undefined') return () => {}

  // Re-read in case storage changed between module evaluation and mount, then
  // tell anyone already subscribed. Skipping the notify leaves the page showing
  // the default with no way to correct it.
  const fresh = read()
  if (fresh !== current) {
    current = fresh
    publish()
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (event: MediaQueryListEvent) => {
    // An explicit choice outranks the system setting.
    if (window.localStorage.getItem(STORAGE_KEY)) return
    current = event.matches ? 'dark' : 'light'
    publish()
  }

  // Keeps other tabs in step. Choosing dark in one tab used to leave every
  // other tab on the old theme until a reload.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    current = read()
    publish()
  }

  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)

  return () => {
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Theme {
  return current
}

export interface ThemeControls {
  theme: Theme
  toggle: () => void
  set: (next: Theme) => void
}

/**
 * Reads the theme and gives back a setter.
 *
 * `getServerSnapshot` is what stops React from warning: on the server the value
 * is always the default, and React knows to expect that.
 */
export function useTheme(): ThemeControls {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)

  const set = useCallback((next: Theme) => {
    current = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Nothing to do. The choice still applies for this page view.
    }
    publish()
  }, [])

  const toggle = useCallback(() => {
    set(current === 'dark' ? 'light' : 'dark')
  }, [set])

  return { theme, toggle, set }
}

/**
 * The CSS variable block for one theme, shared by every page that uses it.
 *
 * The three text tokens are spaced so they read as three distinct levels rather
 * than as three shades of the same grey. The previous values failed WCAG AA. The
 * muted token sat at 2.2 to 1 on a card in dark mode and 3.4 to 1 in light mode,
 * and body sized text needs 4.5 to 1.
 *
 * The middle token had to move as well. Bringing only the muted tone up to the
 * standard left it almost the same colour as the middle tone, so the two levels
 * became indistinguishable, which trades one defect for another.
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
        '--tx:#e0e0ea;--tx2:#9a9ab4;--tx3:#7b7b94;--inv:#fff;--inv2:#07070b;' +
        '--nb:rgba(7,7,11,0.88);' +
        '--kind-added:#11ba82;--kind-fixed:#f69f0c;--kind-changed:#7376ff;--kind-security:#f24747;--kind-removed:#8484a2;'
      : '--bg:#f2f3fb;--bg1:#ffffff;--bg2:#eaebf8;--bg3:#e0e2f5;--br:rgba(0,0,0,0.07);--brh:rgba(0,0,0,0.14);' +
        '--tx:#0a0a18;--tx2:#3f3f66;--tx3:#676789;--inv:#0a0a18;--inv2:#fff;' +
        '--nb:rgba(242,243,251,0.92);' +
        '--kind-added:#00723a;--kind-fixed:#a24b00;--kind-changed:#4a4dd8;--kind-security:#bf1414;--kind-removed:#5e5e7c;'

  // The accents ship inside this block rather than beside it. Leaving them as a
  // separate string each page had to remember to add is exactly how the sign in
  // screens ended up with a button fill that resolved to nothing, which is
  // white writing on a white card.
  //
  // Function declarations hoist, so calling accentVars from here is fine even
  // though it is written further down.
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
 * The light theme text tokens are solved against the tinted chip as well as the
 * plain card. A twelve percent accent wash over the darkest card is darker than
 * the card itself, so a token that clears the card can still miss inside a
 * badge. Two tokens were short by 0.25 before this was measured.
 *
 * Every one is asserted by `__tests__/unit/contrast.test.ts`.
 */
export function accentVars(theme: Theme): string {
  const base = '--ac:#5e6fe8;--ach:#6e7ff8;--as:rgba(94,111,232,0.12);--ag:rgba(94,111,232,0.22);'
  return theme === 'dark'
    ? base +
      '--ac-text:#6f80f9;--ac-solid:#5162db;--ac-solid-h:#4257f0;' +
      '--gr:#22c55e;--am:#f59e0b;--rd:#ef4444;--pu:#a78bfa;' +
      '--gr-text:#22c55e;--am-text:#f59e0b;--rd-text:#f74c4c;--pu-text:#a78bfa;'
    : base +
      '--ac-text:#3f50c9;--ac-solid:#5162db;--ac-solid-h:#3f4bbd;' +
      '--gr:#22c55e;--am:#f59e0b;--rd:#ef4444;--pu:#a78bfa;' +
      '--gr-text:#00720b;--am-text:#a14a00;--rd-text:#ba0f0f;--pu-text:#6a4ebd;'
}