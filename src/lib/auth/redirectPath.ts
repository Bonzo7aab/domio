/**
 * Returns a safe in-app path for post-auth redirects.
 * Rejects absolute/protocol-relative URLs and malformed values.
 */
export function sanitizeRedirectPath(
  rawPath: string | null | undefined,
  fallbackPath = '/'
): string {
  const fallback = normalizeFallbackPath(fallbackPath)
  if (!rawPath) return fallback

  const candidate = rawPath.trim()
  if (!candidate) return fallback
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return fallback

  try {
    // Parse against a fixed origin so only same-origin relative paths are accepted.
    const url = new URL(candidate, 'https://domio.local')
    if (url.origin !== 'https://domio.local') return fallback
    if (!url.pathname.startsWith('/')) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

function normalizeFallbackPath(path: string): string {
  if (path === '') return ''
  if (!path) return '/'

  const candidate = path.trim()
  if (!candidate) return '/'
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/'
  return candidate
}
