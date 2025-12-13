/**
 * Generate random bytes using Web Crypto API.
 * Web Crypto has a 65536 byte limit per getRandomValues call,
 * so we chunk large requests.
 * @param {number} size - Number of random bytes to generate
 * @returns {Uint8Array} Random bytes
 */
export function randomBytes(size) {
  const buffer = new Uint8Array(size)
  const maxChunk = 65536 // Web Crypto API limit

  for (let offset = 0; offset < size; offset += maxChunk) {
    const chunkSize = Math.min(maxChunk, size - offset)
    const chunk = buffer.subarray(offset, offset + chunkSize)
    globalThis.crypto.getRandomValues(chunk)
  }

  return buffer
}

/**
 * Compute SHA-1 hash and return base64 string.
 * @param {Uint8Array | ArrayBuffer} data - Data to hash
 * @returns {Promise<string>} Base64-encoded SHA-1 hash
 */
export async function sha1Base64(data) {
  const hash = await globalThis.crypto.subtle.digest('SHA-1', data)
  const bytes = new Uint8Array(hash)
  // Convert to base64 in chunks to avoid call stack issues with large data
  const chunkSize = 0x8000
  let result = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    result += String.fromCharCode(...chunk)
  }
  return btoa(result)
}
