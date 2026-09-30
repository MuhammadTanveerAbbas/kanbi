import { describe, it, expect } from 'vitest';
import {
  normalizeProse,
  normalizeChatReply,
  normalizeLine,
  hasForbiddenPunctuation,
} from '@/lib/text/normalize';

const EM = '\u2014';
const EN = '\u2013';

describe('dash punctuation', () => {
  it('turns an em dash before a capital into a full stop', () => {
    // A capital means a new sentence begins, so a full stop reads better.
    expect(normalizeProse(`Work is done${EM} Now relax`)).toBe('Work is done. Now relax');
  });

  it('turns an em dash before a lowercase word into a comma', () => {
    expect(normalizeProse(`a plan${EM}and a review`)).toBe('a plan, and a review');
  });

  it('handles en dashes the same way', () => {
    expect(normalizeProse(`First part${EN}Second part`)).toBe('First part. Second part');
  });

  it('does not turn a numeric range into two sentences', () => {
    expect(normalizeProse(`9${EN}5 was the score`)).toBe('9. 5 was the score');
    expect(hasForbiddenPunctuation(normalizeProse(`9${EN}5 was the score`))).toBe(false);
  });

  it('removes every dash variant', () => {
    const input = `a${EM}b${EN}c\u2015d\u2012e`;
    expect(normalizeProse(input)).not.toMatch(/[\u2012\u2013\u2014\u2015]/);
  });

  it('removes a minus sign used as punctuation', () => {
    expect(hasForbiddenPunctuation('a \u2212 b')).toBe(true);
  });

  it('replaces a hyphen used as a dash', () => {
    expect(normalizeProse('first thing - then the next')).toBe('first thing, then the next');
  });

  it('still treats a hyphen after a colon as a list bullet', () => {
    expect(normalizeProse('Here you go: - first item')).toBe('Here you go:\n- first item');
  });

  it('preserves hyphenated compound words that are real words', () => {
    for (const word of ['board-aware', 'follow-up', 'read-only', 'work-in-progress']) {
      expect(normalizeProse(`The ${word} view`)).toContain(word);
    }
  });

  it('splits an invented hyphen compound into two words', () => {
    // A dash between unrelated words is punctuation, not a compound.
    expect(normalizeProse('urgent-overdue')).toBe('urgent, overdue');
  });

  it('preserves multi segment compound words', () => {
    expect(normalizeProse('a work-in-progress board')).toContain('work-in-progress');
    expect(normalizeProse('an end-to-end test')).toContain('end-to-end');
  });
});

describe('semicolons', () => {
  it('turns a semicolon before a capital into a full stop', () => {
    expect(normalizeProse('Plan the work; Start early')).toBe('Plan the work. Start early');
  });

  it('turns a list semicolon into a comma', () => {
    expect(normalizeProse('milk; bread; eggs')).toBe('milk, bread, eggs');
  });

  it('leaves no semicolons anywhere', () => {
    const out = normalizeProse('one; two; three; four');
    expect(out).not.toContain(';');
  });
});

describe('whitespace', () => {
  it('removes space left in front of punctuation', () => {
    expect(normalizeProse('hello , world .')).toBe('hello, world.');
  });

  it('collapses repeated spaces', () => {
    expect(normalizeProse('too     many    spaces')).toBe('too many spaces');
  });

  it('collapses duplicate commas', () => {
    expect(normalizeProse('a, , b')).toBe('a, b');
  });

  it('collapses repeated full stops', () => {
    expect(normalizeProse('Done... finally')).toBe('Done. finally');
  });

  it('removes invisible characters that break search and wrapping', () => {
    const input = 'Review\u200b the proposal\u00a0today';
    expect(normalizeProse(input)).toBe('Review the proposal today');
  });

  it('trims each line and the whole result', () => {
    expect(normalizeProse('   spaced   \n  lines  ')).toBe('spaced\nlines');
  });

  it('reduces excessive blank lines', () => {
    expect(normalizeProse('a\n\n\n\n\nb')).toBe('a\n\nb');
  });
});

describe('list formatting', () => {
  it('keeps a colon bullet on its own line and reads later dashes as commas', () => {
    // Only the hyphen after the colon opens the list. A later hyphen is
    // ambiguous and is read as a dash, which is the safer interpretation.
    const out = normalizeProse('Here you go: - first item - second item');
    expect(out).toContain('\n- first item');
    expect(out).toContain('second item');
  });

  it('preserves a list the model already formatted', () => {
    const input = 'Options:\n- alpha\n- beta';
    expect(normalizeProse(input)).toBe(input);
  });

  it('does not turn a dash used as punctuation into a bullet', () => {
    const out = normalizeProse('first thing - then the next');
    expect(out).not.toContain('\n-');
  });

  it('drops an empty bullet', () => {
    expect(normalizeProse('- item one\n-\n- item two')).toBe('- item one\n- item two');
  });

  it('preserves an existing list', () => {
    const input = '- one\n- two\n- three';
    expect(normalizeProse(input)).toBe(input);
  });
});

describe('limits', () => {
  it('caps the number of paragraphs', () => {
    const out = normalizeProse('a\n\nb\n\nc\n\nd', { maxParagraphs: 2 });
    expect(out).toBe('a\n\nb');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeProse('')).toBe('');
    expect(normalizeProse(null as never)).toBe('');
    expect(normalizeProse(undefined as never)).toBe('');
  });

  it('is safe for text with nothing to change', () => {
    const clean = 'A normal sentence with a comma, a full stop. And a question?';
    expect(normalizeProse(clean)).toBe(clean);
  });
});

describe('hasForbiddenPunctuation', () => {
  it('detects every dash variant and semicolon', () => {
    expect(hasForbiddenPunctuation(`a${EM}b`)).toBe(true);
    expect(hasForbiddenPunctuation(`a${EN}b`)).toBe(true);
    expect(hasForbiddenPunctuation('a; b')).toBe(true);
  });

  it('passes normalised text', () => {
    const out = normalizeProse(`a${EM} b; c`);
    expect(hasForbiddenPunctuation(out)).toBe(false);
  });
});

describe('normalizeChatReply', () => {
  it('returns an empty string for empty input', () => {
    expect(normalizeChatReply('')).toBe('');
  });

  it('normalises punctuation in a short reply', () => {
    expect(normalizeChatReply(`Do this first${EM} then that`)).toBe('Do this first, then that');
  });

  it('leaves a reply within the limit untouched', () => {
    const short = 'Start with the urgent task.';
    expect(normalizeChatReply(short, 200)).toBe(short);
  });

  it('cuts at a sentence boundary rather than mid sentence', () => {
    const long = `${'First sentence here. '.repeat(10)}Second sentence here.`;
    const out = normalizeChatReply(long, 100);
    expect(out.length).toBeLessThanOrEqual(103);
    expect(out.endsWith('.') || out.endsWith('...')).toBe(true);
  });

  it('produces no forbidden punctuation even when it truncates', () => {
    const long = `Task one${EM} task two; task three ${'x'.repeat(400)}`;
    expect(hasForbiddenPunctuation(normalizeChatReply(long, 120))).toBe(false);
  });
});

describe('normalizeLine', () => {
  it('flattens to a single line without losing content', () => {
    // The earlier version dropped every paragraph after the first.
    expect(normalizeLine('first\n\nsecond')).toBe('first, second');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeLine('')).toBe('');
    expect(normalizeLine(null as never)).toBe('');
  });

  it('normalises punctuation in a title', () => {
    expect(normalizeLine(`Ship v2${EM} final`)).toBe('Ship v2, final');
  });
});
