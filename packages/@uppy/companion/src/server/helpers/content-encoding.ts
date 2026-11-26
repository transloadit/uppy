// The IANA content-coding registry, apart from `identity`
const COMPRESSION_ENCODINGS = new Set([
  'aes128gcm',
  'br',
  'compress',
  'dcb',
  'dcz',
  'deflate',
  'exi',
  'gzip',
  'pack200-gzip',
  'x-compress',
  'x-gzip',
  'zstd',
])

/**
 * Whether a Content-Encoding header names real compression. Misconfigured
 * servers also send values like `binary` or `UTF-8`, whose bytes are the
 * original content.
 */
export function isCompressed(
  contentEncoding: string | null | undefined,
): boolean {
  return (contentEncoding ?? '')
    .toLowerCase()
    .split(',')
    .some((encoding) => COMPRESSION_ENCODINGS.has(encoding.trim()))
}
