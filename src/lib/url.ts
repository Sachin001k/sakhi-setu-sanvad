/**
 * True only for absolute http(s) URLs. Rejects javascript:, data:, etc.
 */
export function isSafeHttpUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Open a user-supplied URL in a new tab, but only if it is http(s).
 * Returns whether the URL was opened.
 */
export function openExternal(url: string | null | undefined): boolean {
  if (!isSafeHttpUrl(url)) return false;
  window.open(url.trim(), '_blank', 'noopener,noreferrer');
  return true;
}
