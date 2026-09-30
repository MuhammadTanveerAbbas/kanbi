/**
 * Copies text to the clipboard.
 *
 * Uses the async Clipboard API when it is available and permitted, then falls
 * back to a hidden textarea for older browsers and for the case where
 * permission is denied. Returns a boolean so the caller can show a real
 * confirmation rather than assuming success.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof text !== 'string' || text.length === 0) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or not a secure context. Fall through to the fallback.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Off screen rather than hidden, because display:none prevents selection.
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
