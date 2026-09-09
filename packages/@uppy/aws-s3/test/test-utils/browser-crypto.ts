/**
 * Generate random bytes using Web Crypto API.
 * Web Crypto has a 65536 byte limit per getRandomValues call,
 * so we chunk large requests.
 */
export function randomBytes(size: number) {
  const buffer = new Uint8Array(size)
  const maxChunk = 65536 // Web Crypto API limit

  for (let offset = 0; offset < size; offset += maxChunk) {
    const chunkSize = Math.min(maxChunk, size - offset)
    const chunk = buffer.subarray(offset, offset + chunkSize)
    globalThis.crypto.getRandomValues(chunk)
  }

  return buffer
}
