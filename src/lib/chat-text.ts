/** Strip em/en dashes from AI text; use plain punctuation instead. */
export function sanitizeChatText(text: string): string {
  return text
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/,\s*,/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Keep chat replies short and scannable. */
export function truncateChatResponse(text: string, maxChars = 280): string {
  const cleaned = sanitizeChatText(text);
  if (cleaned.length <= maxChars) return cleaned;

  const slice = cleaned.slice(0, maxChars);
  const lastStop = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  if (lastStop > maxChars * 0.45) return slice.slice(0, lastStop + 1).trim();

  return `${slice.trim()}...`;
}
