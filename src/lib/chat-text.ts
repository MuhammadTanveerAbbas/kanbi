/**
 * Chat text helpers.
 *
 * Re-exported from the shared prose normaliser so that chat, briefings, and
 * exported documents all use exactly one set of punctuation rules.
 *
 * The older local implementation replaced every em dash with a comma, which
 * produced text like "a plan, and a review". The shared normaliser chooses
 * between a full stop and a comma based on what follows the dash.
 */

export {
  normalizeProse,
  normalizeChatReply,
  normalizeLine,
  hasForbiddenPunctuation,
  type NormalizeOptions,
} from '@/lib/text/normalize';

import { normalizeChatReply as normalize, normalizeLine as toLine } from '@/lib/text/normalize';

/** Normalises a chat reply and keeps it scannable. */
export function sanitizeChatText(text: string): string {
  return normalize(text);
}

/** Kept for callers that want a short, single line reply. */
export function truncateChatResponse(text: string, maxChars = 320): string {
  return normalize(text, maxChars);
}

/** Normalises a task title, label, or other single line of text. */
export function normalizeChatLine(text: string): string {
  return toLine(text);
}
