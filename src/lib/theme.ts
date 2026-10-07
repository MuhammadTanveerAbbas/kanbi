'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/design-tokens'

/**
 * The client theme store.
 *
 * ## Why the store is not the palette
 *
 * The palette lives in `src/lib/design-tokens.ts`, which is a plain module with
 * no `'use client'`. That split is structural, not cosmetic: the root layout is
 * a server component and has to emit the stylesheet and the bootstrap script,
 * and a server component cannot call a function exported from a client module.
 * Keeping the data here and the React store there lets both use one source.
 *
 * ## Why there is no flash
 *
 * The previous implementation applied the palette by interpolating it into a
 * `<style>` element rendered *inside* each page component, from React state.
 * That is the direct cause of the light flash on navigation and on refresh:
 *
 * 1. On the server the store had no window, so it answered the default.
 * 2. The browser painted that HTML. The user saw the default theme.
 * 3. Hydration ran, read `localStorage`, and React swapped the `<style>`.
 *
 * The flash is not a timing bug. It is a structural one: the theme was carried
 * in React output, so the first paint could never know the real answer.
 *
 * Now the palette is CSS scoped by `[data-theme]`, a blocking script in the
 * head sets that attribute before the body is parsed, and this store only
 * *reacts* to a change. Navigation, refresh, and a direct load of a nested route
 * all take the identical path, which is the only reason they can be identical.
 *
 * See `__tests__/unit/theme.test.ts`, which asserts the structure rather than
 * the symptom.
 */

export type { Theme }
export { DEFAULT_THEME, THEME_STORAGE_KEY }

/**
 * Reads the stored preference, or the default when there is none.
 *
 * Never consults `prefers-color-scheme`. A first-time visitor gets light.
 */
export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // Private browsing and blocked storage both make this throw. The default is
    // a perfectly good answer.
  }
  return DEFAULT_THEME
}

let current: Theme = readStoredTheme()
const listeners = new Set<() => void>()

function publish(): void {
  for (const listener of listeners) listener()
}

/**
 * Applies the theme to the document.
 *
 * The only place that touches the DOM. The blocking head script performs the
 * same two writes, so the two paths agree and a toggle is a single attribute
 * change that the stylesheet repaints from, with no tearing.
 */
function applyToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = theme
  // Keeps form controls, scrollbars, and the mobile address bar in the same
  // theme as the page instead of the browser's own default.
  root.style.colorScheme = theme
}

export function getTheme(): Theme {
  return current
}

export function setTheme(next: Theme): void {
  current = next
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // The choice still applies for this page view.
  }
  applyToDocument(next)
  publish()
}

export function toggleTheme(): void {
  setTheme(current === 'dark' ? 'light' : 'dark')
}

/**
 * Syncs the in-memory value with what is actually stored and rendered.
 *
 * Called once, by the provider. A second tab can change the preference and a
 * bfcache restore can skip hydration, so the store re-reads storage on mount
 * rather than trusting what it captured when the module was first evaluated.
 */
export function startThemeWatch(): () => void {
  if (typeof window === 'undefined') return () => {}

  const fresh = readStoredTheme()
  if (fresh !== current) {
    current = fresh
    publish()
  }
  applyToDocument(current)

  // Keeps other tabs in step. Choosing dark in one tab used to leave every
  // other tab on the old theme until a reload.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    current = readStoredTheme()
    applyToDocument(current)
    publish()
  }

  window.addEventListener('storage', onStorage)
  return () => {
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

/**
 * Always the default.
 *
 * This is what stops a hydration mismatch. The server and the first client
 * render both answer light, which is what the HTML already contained, so React
 * has nothing to reconcile. The real value arrives in the attribute the head
 * script already set, and the very next `getSnapshot` reflects it.
 */
function getServerSnapshot(): Theme {
  return DEFAULT_THEME
}

export interface ThemeControls {
  theme: Theme
  toggle: () => void
  set: (next: Theme) => void
}

export function useTheme(): ThemeControls {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const set = useCallback((next: Theme) => setTheme(next), [])
  const toggle = useCallback(() => toggleTheme(), [])

  return { theme, toggle, set }
}

/**
 * Re-exported so a component can reach the tokens without knowing which module
 * they physically live in. Importing from `design-tokens` directly is equally
 * correct and is what the server side does.
 */
export { themeInitScript, themeStyleSheet, themeVars, appThemeVars, accentVars } from '@/lib/design-tokens'
export { FONT_BODY, FONT_DISPLAY, FONT_MONO, FONT_TOKENS } from '@/lib/design-tokens'
