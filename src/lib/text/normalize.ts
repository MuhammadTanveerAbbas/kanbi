/**
 * Prose normalisation.
 *
 * Kanbi writes plain punctuation. No em dashes, no en dashes used as
 * punctuation, and no semicolons. Models reach for all three by default, and
 * they look wrong in a dense product interface, so every piece of generated or
 * authored text passes through here before it is displayed.
 *
 * The goal is readable text, not text that merely passes a check. Replacements
 * are chosen so the sentence still reads naturally:
 *
 *   dash before a capital   ->  a full stop, because a new sentence starts
 *   dash before a lowercase ->  a comma, because the clause continues
 *   semicolon               ->  a full stop between clauses, a comma in a list
 *
 * Hyphenated compound words that are real words, such as "follow-up", are
 * preserved. A hyphen between unrelated words is treated as punctuation.
 * Programming punctuation inside identifiers and file names is left alone,
 * because that is not prose.
 */

const EM_DASH = '\u2014';
const EN_DASH = '\u2013';
const HORIZONTAL_BAR = '\u2015';
const FIGURE_DASH = '\u2012';
const MINUS_SIGN = '\u2212';
const NO_BREAK_SPACE = '\u00a0';
const NARROW_NO_BREAK_SPACE = '\u202f';
const THIN_SPACE = '\u2009';
const ZERO_WIDTH_SPACE = '\u200b';
const ZERO_WIDTH_JOINER = '\u200d';
const SOFT_HYPHEN = '\u00ad';

const DASH_VARIANTS = [EM_DASH, EN_DASH, HORIZONTAL_BAR, FIGURE_DASH];

/** Hyphenated words that are real vocabulary and must survive untouched. */
const KEEP_HYPHENATED = new Set([
  'board-aware',
  'well-being',
  'follow-up',
  'follow-ups',
  'read-only',
  'write-only',
  'work-in-progress',
  'one-click',
  'no-code',
  'low-code',
  'real-time',
  'server-side',
  'client-side',
  'row-level',
  'top-priority',
  'high-priority',
  'low-priority',
  'user-supplied',
  'machine-generated',
  'state-of-the-art',
  'end-to-end',
  'out-of-office',
]);

export interface NormalizeOptions {
  /** Keep at most this many paragraphs. */
  maxParagraphs?: number;
  /** Remove leading and trailing whitespace. Defaults to true. */
  trim?: boolean;
  /**
   * Turn a bullet written inline into a real list item. Defaults to true.
   * Only fires for a hyphen that starts a line or follows a colon, so a
   * hyphen used as a dash is not mistaken for a bullet.
   */
  fixInlineBullets?: boolean;
}

/** True when a character can begin a sentence. */
function startsSentence(char: string): boolean {
  return /[A-Z0-9"'\u201c(]/.test(char);
}

/**
 * Replaces dash punctuation with a natural alternative.
 *
 * A dash followed by a capital begins a new sentence, so it becomes a full
 * stop. A dash followed by a lowercase word continues the clause, so it becomes
 * a comma.
 */
function replaceDashes(text: string): string {
  let result = text;

  for (const dash of DASH_VARIANTS) {
    // Look one character past the dash so the case of the next word decides.
    result = result.replace(
      new RegExp(`\\s*${dash}\\s*(.)`, 'g'),
      (_match, next: string) => (startsSentence(next) ? `. ${next}` : `, ${next}`)
    );
  }

  // A hyphen run joining letters, with no spaces, is either a compound word or
  // punctuation. Check the whole compound against the vocabulary list.
  result = result.replace(/[A-Za-z]{2,}(?:-[A-Za-z]{2,})+/g, (match) =>
    KEEP_HYPHENATED.has(match.toLowerCase()) ? match : match.replace(/-/g, ', ')
  );

  return result;
}

/**
 * Turns a hyphen used as a dash into a comma, unless it is opening a list item.
 *
 * "first thing - then next" is punctuation. "Here you go: - first" is a list.
 */
function replaceSpacedHyphen(text: string, fixInlineBullets: boolean): string {
  // Every pattern below uses [ \t] rather than \s, because \s also matches a
  // newline and would collapse a real list onto one line.
  if (!fixInlineBullets) {
    return text.replace(/[ \t]+-[ \t]+/g, ', ');
  }
  // A hyphen is a bullet when it opens a line or directly follows a colon.
  return (
    text
      .replace(/(^|\n)[ \t]*-[ \t]+(?=\S)/g, '$1- ')
      .replace(/:[ \t]*-[ \t]+(?=\S)/g, ':\n- ')
      // A hyphen surrounded by spaces on one line is a dash.
      .replace(/[ \t]+-[ \t]+/g, ', ')
  );
}

/** Replaces semicolons. Both passes are applied in sequence. */
function replaceSemicolons(text: string): string {
  // A semicolon before a capital is really a full stop between clauses.
  const withStops = text.replace(/;\s*(?=[A-Z0-9"'\u201c(])/g, '. ');
  // Anything left, such as "milk; bread", is a list and reads better with commas.
  return withStops.replace(/\s*;\s*/g, ', ');
}

/** Removes invisible characters that break search, wrapping, and comparison. */
function stripInvisible(text: string): string {
  let result = text;
  for (const char of [
    ZERO_WIDTH_SPACE,
    ZERO_WIDTH_JOINER,
    SOFT_HYPHEN,
    NARROW_NO_BREAK_SPACE,
    THIN_SPACE,
  ]) {
    result = result.split(char).join('');
  }
  // Non breaking spaces become ordinary spaces so wrapping behaves normally.
  return result.split(NO_BREAK_SPACE).join(' ');
}

/** Collapses runs of spaces and tidies spacing around punctuation. */
function fixWhitespace(text: string): string {
  return (
    text
      // Space before punctuation left behind by a removed character.
      .replace(/[ \t]+([,.:!?])/g, '$1')
      // No space after an opening bracket.
      .replace(/([(\[{])[ \t]+/g, '$1')
      // Duplicate commas produced by removing a character between them.
      .replace(/,[ \t]*,+/g, ', ')
      // Repeated sentence terminators.
      .replace(/([.!])[ \t]*\1+/g, '$1')
      // Repeated whitespace within a line.
      .replace(/[ \t]{2,}/g, ' ')
  );
}

/** Removes bullets that have no content and collapses blank line runs. */
function fixListFormatting(text: string): string {
  return text
    // A bullet with nothing after it.
    .replace(/^[ \t]*[-*][ \t]*\n/gm, '')
    // At most one blank line between blocks.
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Normalises text for display.
 *
 * Safe on any string, including empty input and text that needs no changes.
 */
export function normalizeProse(input: string, options: NormalizeOptions = {}): string {
  if (typeof input !== 'string' || input.length === 0) return '';

  const { maxParagraphs, trim = true, fixInlineBullets = true } = options;

  let text = stripInvisible(input);
  text = replaceDashes(text);
  text = replaceSemicolons(text);
  text = replaceSpacedHyphen(text, fixInlineBullets);
  text = fixWhitespace(text);
  text = fixListFormatting(text);

  if (trim) {
    text = text
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .trim();
  }

  if (typeof maxParagraphs === 'number' && maxParagraphs > 0) {
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    text = paragraphs.slice(0, maxParagraphs).join('\n\n');
  }

  return text;
}

/** True when the text still contains punctuation Kanbi does not publish. */
export function hasForbiddenPunctuation(input: string): boolean {
  if (typeof input !== 'string') return false;
  for (const char of DASH_VARIANTS) {
    if (input.includes(char)) {
      return true;
    }
  }
  return input.includes(';') || input.includes(MINUS_SIGN);
}

/**
 * Normalises a chat reply and keeps it scannable.
 *
 * A long reply is cut at a sentence or line boundary when one is reasonably
 * close to the limit, so a cut never lands mid sentence.
 */
export function normalizeChatReply(input: string, maxChars = 320): string {
  const cleaned = normalizeProse(input);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= maxChars) return cleaned;

  const slice = cleaned.slice(0, maxChars);
  // Cut only at a sentence or line boundary. Cutting mid sentence, or after a
  // comma, produces a reply that reads as broken.
  const boundaries = [slice.lastIndexOf('. '), slice.lastIndexOf('\n')].filter(
    (index) => index > 0
  );
  const best = boundaries.length > 0 ? Math.max(...boundaries) : -1;

  if (best > maxChars * 0.4) {
    // The index points at the space after the full stop, so add one to keep the
    // punctuation. Without this the reply ends mid word with no full stop.
    return slice.slice(0, best + 1).trim();
  }
  return `${slice.trim()}...`;
}

/** Normalises a single line, such as a task title or a label. */
export function normalizeLine(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return '';
  // Collapse everything, including blank lines, into one line.
  return normalizeProse(input, { fixInlineBullets: false })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(', ');
}
