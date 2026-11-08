const separator = /[/+.]/

/**
 * Whether a MIME type matches a pattern such as `image/*`, with the semantics
 * of mime-match 1.0.2 and wildcard 1.1.2 (MIT): both are split on `/`, `+` and
 * `.`, a `*` part matches any one part (or nothing, past the end of the
 * pattern), other parts must be equal, parameters after `;` in the pattern are
 * ignored, and the target needs at least two parts.
 */
export default function mimeMatch(target: string, pattern: string): boolean {
  const text = pattern.split(';')[0]
  if (!text.includes('*') && text !== target) return false

  const targetParts = target.split(separator)
  const matches = text
    .split(separator)
    .every(
      (part, i) =>
        part === '*' || (i < targetParts.length && part === targetParts[i]),
    )
  return matches && targetParts.length >= 2
}
