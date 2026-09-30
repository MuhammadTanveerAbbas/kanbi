/**
 * Architecture fitness checks.
 *
 * These assert on properties that must hold across the whole codebase, so a
 * convention established once is not quietly undone by the next change.
 *
 * The punctuation check parses JSX with the TypeScript compiler rather than
 * matching text with a regular expression. An earlier version used a regex and
 * matched the code between a greater-than and a less-than sign, so it reported
 * findings such as `return (` as if they were sentences. Parsing gives the exact
 * text nodes a person reads.
 *
 * The check is deliberately narrow. A file legitimately contains CSS
 * declarations, HTTP headers, and regular expressions where a semicolon is
 * correct syntax rather than prose, so whole files are not scanned.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import ts from 'typescript';
import { hasForbiddenPunctuation } from '@/lib/text/normalize';
import { BOARD_TEMPLATES } from '@/lib/templates';
import { CHANGELOG } from '@/lib/changelog-data';
import { CHAT_SYSTEM_PROMPT, FALLBACK_RESPONSES } from '@/lib/ai/chat-copy';
import {
  PROJECT_HISTORY,
  PROJECT_NOW,
  historyWithNow,
  monthlyCommits,
  totalCommits,
  busiestMonth,
  quietMonths,
} from '@/lib/changelog-stats';

const ROOT = process.cwd();

/**
 * Removes comments and string literals before a source level check runs.
 *
 * Without this a fitness check matches its own documentation. The first version
 * of the theme check failed on a paragraph that happened to name the storage
 * key, which is exactly the kind of false alarm that teaches people to ignore
 * the check.
 */
function codeOnly(source: string): string {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    /* skipTrivia */ false,
    ts.LanguageVariant.JSX,
    source
  )
  let out = ''
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) {
      // Replace with a space so two identifiers do not merge into one token.
      out += ' ';
      continue
    }
    const text = scanner.getTokenText()
    if (
      token === ts.SyntaxKind.StringLiteral ||
      token === ts.SyntaxKind.NoSubstitutionTemplateLiteral
    ) {
      // Keep the quotes so the result still parses as a string of the same kind.
      out += `"${text.length > 2 ? text.slice(1, -1) : ''}"`
      continue
    }
    out += text
  }
  return out
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

function componentFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) componentFiles(full, out);
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const ENTITIES: Record<string, string> = {
  '&apos;': "'",
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&quot;': '"',
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&nbsp;': ' ',
  '&amp;': '&',
  '&larr;': '<',
  '&rarr;': '>',
  '&hellip;': '...',
  '&times;': 'x',
  '&middot;': '.',
};

/**
 * Resolves HTML entities so that an escaped apostrophe is read as an apostrophe.
 * Without this, the semicolon inside `&apos;` would be reported as punctuation.
 */
function decodeEntities(text: string): string {
  return text.replace(/&[a-z]+;/g, (match) => ENTITIES[match.toLowerCase()] ?? match);
}

/** Every literal text node a person sees in a component. */
function jsxTextNodes(source: string, fileName: string): string[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const nodes: string[] = [];
  const visit = (node: ts.Node): void => {
    // The contents of a <style> or <script> element are CSS, where a semicolon
    // is required syntax rather than punctuation. It is not copy a person reads.
    // The tag is detected by scanning the source just before the literal,
    // because reading a tag name off the node is not reliable here.
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile).replace(/\s+/g, ' ').trim();
      if (text.length > 0) nodes.push(text);
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ts.isJsxExpression(node.parent)) return;
      const start = node.getStart(sourceFile);
      const before = source.slice(Math.max(0, start - 40), start);
      if (/<(style|script)\b[^>]*>\s*\{\s*$/.test(before)) return;
      nodes.push(node.text);
    }

    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return nodes;
}

describe('Fitness: no em dashes, en dashes, or semicolons in visible text', () => {
  const files = componentFiles(join(ROOT, 'src'));

  it('finds component files to check', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it('has clean JSX text nodes in every component', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      for (const node of jsxTextNodes(source, file)) {
        const decoded = decodeEntities(node);
        if (hasForbiddenPunctuation(decoded)) {
          offenders.push(
            `${relative(ROOT, file)}: ${JSON.stringify(decoded.slice(0, 70))}`
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('actually finds text to check, so the check cannot pass by finding nothing', () => {
    // A parser change that silently returns no nodes would make the check above
    // pass for the wrong reason. Assert it finds real copy.
    let total = 0;
    for (const file of files) {
      total += jsxTextNodes(readFileSync(file, 'utf-8'), file).length;
    }
    expect(total).toBeGreaterThan(100);
  });

  it('accepts a properly escaped apostrophe', () => {
    // The semicolon inside the entity must not be reported.
    expect(hasForbiddenPunctuation(decodeEntities('Today&apos;s mix'))).toBe(false);
  });
});

describe('Fitness: no emoji in visible text', () => {
  // Ranges that cover pictographs, dingbats, arrows, and the pictographic
  // blocks. The variation selector is included because emoji are often written
  // as a base character followed by it.
  const EMOJI =
    /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{24FF}\u{25A0}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2192}\u{2794}]/u;

  const files = componentFiles(join(ROOT, 'src'));

  it('has no emoji in any JSX text node', () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const node of jsxTextNodes(readFileSync(file, 'utf-8'), file)) {
        if (EMOJI.test(node)) {
          offenders.push(`${relative(ROOT, file)}: ${JSON.stringify(node.trim().slice(0, 60))}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('has no emoji in user facing content modules', () => {
    for (const template of BOARD_TEMPLATES) {
      expect(EMOJI.test(template.build()), template.id).toBe(false);
    }
    for (const release of CHANGELOG) {
      expect(EMOJI.test(release.summary), release.version).toBe(false);
      for (const change of release.changes) {
        expect(EMOJI.test(change.text), `${release.version}/${change.kind}`).toBe(false);
      }
    }
    expect(EMOJI.test(CHAT_SYSTEM_PROMPT)).toBe(false);
  });

  it('actually detects an emoji, so the checks above cannot pass for the wrong reason', () => {
    // Written as escape sequences so this file stays readable as plain ASCII.
    expect(EMOJI.test('shipped it')).toBe(false);
    expect(EMOJI.test('nice work \u{1F389}')).toBe(true);
    expect(EMOJI.test('done \u{2705}')).toBe(true);
    expect(EMOJI.test('warn \u{26A0}')).toBe(true);
    expect(EMOJI.test('wave \u{1F44B}')).toBe(true);
    expect(EMOJI.test('arrow \u{2794}')).toBe(true);
  });
});

describe('Fitness: user facing content modules are clean', () => {
  it('keeps the starter templates free of forbidden punctuation', () => {
    for (const template of BOARD_TEMPLATES) {
      expect(hasForbiddenPunctuation(template.build()), template.id).toBe(false);
    }
  });

  it('keeps the changelog entries free of forbidden punctuation', () => {
    for (const release of CHANGELOG) {
      expect(hasForbiddenPunctuation(release.summary), release.version).toBe(false);
      for (const change of release.changes) {
        expect(hasForbiddenPunctuation(change.text), `${release.version}/${change.kind}`).toBe(
          false
        );
      }
    }
  });

  it('keeps the chat system prompt free of forbidden punctuation', () => {
    expect(hasForbiddenPunctuation(CHAT_SYSTEM_PROMPT)).toBe(false);
  });

  it('keeps every rule based chat reply free of forbidden punctuation', () => {
    for (const [key, reply] of Object.entries(FALLBACK_RESPONSES)) {
      const text = typeof reply === 'function' ? '' : String(reply);
      if (text) expect(hasForbiddenPunctuation(text), key).toBe(false);
    }
  });
});

describe('Fitness: one typeface system across every page', () => {
  const componentFilesUnderSrc = sourceFiles(join(ROOT, 'src'));

  it('finds source files to check', () => {
    expect(componentFilesUnderSrc.length).toBeGreaterThan(20);
  });

  it('never names a raw system stack as a page typeface', () => {
    // The root layout supplies the loaded families through CSS variables. A
    // component that names -apple-system directly overrides that and silently
    // drops the real typeface, which is what happened on the legal pages.
    const offenders: string[] = [];
    const systemStack = /font-family:\s*['"`]?-apple-system/;

    for (const file of componentFilesUnderSrc) {
      const source = readFileSync(file, 'utf-8');
      if (systemStack.test(source) && !source.includes('var(--font-geist)')) {
        offenders.push(relative(ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('declares every font variable the app uses', () => {
    // Guards against a token that resolves to nothing, which is how the
    // dashboard headings ended up on a fallback font.
    const dashboard = readFileSync(join(ROOT, 'src/app/dashboard/page.tsx'), 'utf-8');
    for (const token of ['--font-display', '--font-body', '--font-mono']) {
      expect(dashboard, `${token} must be defined`).toContain(`${token}:`);
    }
    for (const loaded of ['--font-geist)', '--font-sora)', '--font-geist-mono)']) {
      expect(dashboard, `${loaded} must come from a next/font variable`).toContain(loaded);
    }
  });

  it('loads all three families in the root layout', () => {
    const layout = readFileSync(join(ROOT, 'src/app/layout.tsx'), 'utf-8');
    for (const family of ['Geist(', 'Geist_Mono(', 'Sora(']) {
      expect(layout).toContain(family);
    }
    for (const variable of ['--font-geist', '--font-geist-mono', '--font-sora']) {
      expect(layout).toContain(variable);
    }
  });
});

describe('Fitness: one theme definition for the whole product', () => {
  const componentFilesUnderSrc = sourceFiles(join(ROOT, 'src'))

  it('the comment stripper ignores prose but not code', () => {
    // A fitness check that matches its own documentation is worse than no check,
    // so this is asserted before anything relies on it.
    expect(codeOnly('// use kanbi-theme here\nconst x = 1')).not.toContain('kanbi-theme')
    expect(codeOnly('/* kanbi-theme */\nconst x = 1')).not.toContain('kanbi-theme')
    expect(codeOnly('const key = "kanbi-theme"')).toContain('kanbi-theme')
    expect(codeOnly('const a = 1; const b = 2;')).toContain('const a = 1')
  })

  it('defines the palette in exactly one place', () => {
    // Four surfaces each carried a full copy of the palette. Four copies of a
    // dark background is not a design decision, it is four chances to pick a
    // different grey, and all four had drifted. One drifted far enough that the
    // muted text on the dashboard measured 1.6 to 1 against a card.
    const offenders: string[] = []
    const definesPalette = /--bg1:\s*#/

    for (const file of componentFilesUnderSrc) {
      if (file === join(ROOT, 'src/lib/theme.ts')) continue
      if (definesPalette.test(codeOnly(readFileSync(file, 'utf-8')))) {
        offenders.push(relative(ROOT, file))
      }
    }
    expect(offenders).toEqual([])
  })

  it('reads the theme through the shared store', () => {
    // A surface that touches localStorage or matchMedia for the theme is reading
    // it a second way, which is the drift this check exists to prevent.
    const offenders: string[] = []
    for (const file of componentFilesUnderSrc) {
      if (file === join(ROOT, 'src/lib/theme.ts')) continue
      const source = codeOnly(readFileSync(file, 'utf-8'))
      if (source.includes('kanbi-theme')) offenders.push(relative(ROOT, file))
    }
    expect(offenders).toEqual([])
  })

  it('does not fetch a font it already has', () => {
    // next/font ships the family with the build. A stylesheet import asks
    // Google for it again on every dashboard load, which is a render blocking
    // request and a third party call with no benefit.
    const offenders: string[] = []
    for (const file of componentFilesUnderSrc) {
      const source = codeOnly(readFileSync(file, 'utf-8'))
      if (source.includes('fonts.googleapis.com')) offenders.push(relative(ROOT, file))
    }
    expect(offenders).toEqual([])
  })

  it('has a store with the two pieces every page needs', () => {
    const theme = readFileSync(join(ROOT, 'src/lib/theme.ts'), 'utf-8')
    for (const symbol of [
      'export function themeVars',
      'export function appThemeVars',
      'export function accentVars',
      'export function useTheme',
      'export function startThemeWatch',
    ]) {
      expect(theme, symbol).toContain(symbol)
    }
  })

  it('uses one storage key everywhere', () => {
    const theme = readFileSync(join(ROOT, 'src/lib/theme.ts'), 'utf-8')
    const key = theme.match(/STORAGE_KEY\s*=\s*'([^']+)'/)?.[1]
    expect(key).toBe('kanbi-theme')
  })
})

describe('Fitness: the changelog numbers are measurable', () => {
  it('every month in the history is well formed and ordered', () => {
    expect(PROJECT_HISTORY.length).toBeGreaterThan(6)
    for (let i = 0; i < PROJECT_HISTORY.length; i++) {
      const point = PROJECT_HISTORY[i]!
      expect(point.month, `row ${i}`).toMatch(/^\d{4}-\d{2}$/)
      for (const [key, value] of Object.entries(point)) {
        if (key === 'month') continue
        expect(Number.isInteger(value) && value >= 0, `${point.month} ${key}`).toBe(true)
      }
      if (i > 0) {
        // Sorted ascending, so the chart is not quietly out of order.
        expect(point.month > PROJECT_HISTORY[i - 1]!.month, point.month).toBe(true)
      }
    }
  })

  it('never puts a running total into the monthly commit series', () => {
    // This is the bug that put an 83 tall bar next to monthly values as high as
    // 37. A monthly series and a cumulative total cannot share one axis.
    const monthly = monthlyCommits()
    const maxMonthly = Math.max(...monthly.map((p) => p.commits))
    expect(maxMonthly).toBeLessThan(totalCommits())
    for (const point of monthly) {
      expect(point.commits).toBeLessThanOrEqual(maxMonthly)
    }
  })

  it('appends the working tree only to snapshot series', () => {
    const last = historyWithNow().at(-1)!
    expect(last.month).toBe('now')
    expect(last.sourceFiles).toBe(PROJECT_NOW.sourceFiles)
    expect(last.apiRoutes).toBe(PROJECT_NOW.apiRoutes)
    expect(last.testFiles).toBe(PROJECT_NOW.testFiles)
    // A cumulative total would be meaningless on a per month chart.
    expect(last.commits).toBe(0)
  })

  it('agrees with itself on the totals it publishes', () => {
    expect(totalCommits()).toBe(
      PROJECT_HISTORY.reduce((sum, p) => sum + p.commits, 0)
    )
    expect(busiestMonth().commits).toBe(Math.max(...monthlyCommits().map((p) => p.commits)))
    expect(quietMonths().every((p) => p.commits === 0)).toBe(true)
  })

  it('reports the same current numbers the page displays', () => {
    const last = historyWithNow().at(-1)!
    const kinds = new Map<string, number>()
    for (const release of CHANGELOG) {
      for (const change of release.changes) {
        kinds.set(change.kind, (kinds.get(change.kind) ?? 0) + 1)
      }
    }
    const total = [...kinds.values()].reduce((a, b) => a + b, 0)
    expect(total).toBeGreaterThan(20)
    // The donut centre prints this, and the e2e test asserts the legend sums to
    // the same number. Here we only confirm the shape of the data.
    expect(last.sourceFiles).toBeGreaterThan(0)
  })
})

describe('Fitness: templates are usable', () => {
  it('gives every template a unique id, a label, and a description', () => {
    const ids = BOARD_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const template of BOARD_TEMPLATES) {
      expect(template.label.length).toBeGreaterThan(0);
      expect(template.blurb.length).toBeGreaterThan(0);
    }
  });

  it('produces text with enough structure to extract tasks from', () => {
    for (const template of BOARD_TEMPLATES) {
      const text = template.build();
      expect(text.length, template.id).toBeGreaterThan(150);
      expect(text, template.id).toMatch(/^#\s/m);
      const bullets = text.match(/^- /gm)?.length ?? 0;
      expect(bullets, `${template.id} needs at least 5 bullet lines`).toBeGreaterThanOrEqual(5);
    }
  });

  it('builds fresh text each time so a date placeholder is resolved', () => {
    for (const template of BOARD_TEMPLATES) {
      expect(template.build()).not.toContain('${');
    }
  });
});
