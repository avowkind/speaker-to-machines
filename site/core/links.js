/** Links from files a person holds are shown only if they are web links. */
/**
 * A link safe to put in an href: http or https only, so a file or profile
 * can't smuggle in a javascript: URL.
 * @param {unknown} url
 * @returns {string | undefined}
 */
export function safeLink(url) {
  if (typeof url !== 'string') return undefined;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}
