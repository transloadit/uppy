/**
 * Generate a random RFC 4122 version 4 UUID.
 *
 * `crypto.randomUUID()` is only available in secure contexts (HTTPS or
 * localhost), so elsewhere (e.g. plain HTTP) we build the UUID from
 * `crypto.getRandomValues()`, which is available in all contexts and is just
 * as cryptographically secure.
 *
 * @returns A UUID like `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.
 */
export default function randomUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx (RFC 4122)
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
