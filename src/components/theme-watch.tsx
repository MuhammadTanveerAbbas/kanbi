'use client'

import { useEffect, type ReactNode } from 'react'
import { startThemeWatch } from '@/lib/theme'

/**
 * The one place the theme watch is started.
 *
 * Six page components each ran `useEffect(() => startThemeWatch())` in an
 * attempt to keep the store current. Six listeners for the system preference
 * and six for cross-tab updates, and on a page that nested two of those
 * components, a single toggle published twice.
 *
 * Mounting it once in the root layout means there is exactly one watcher for
 * the whole application regardless of which page is open, and every page reads
 * the same store through `useTheme`.
 */
export function ThemeWatch() {
  useEffect(() => startThemeWatch(), [])
  return null
}
