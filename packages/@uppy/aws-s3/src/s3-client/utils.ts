import type { ErrorWithCode, XmlMap, XmlValue } from './types.js'

const ENCODR = new TextEncoder()
const chunkSize = 0x8000 // 32KB chunks
const HEXS = '0123456789abcdef'

export const getByteSize = (data: unknown): number => {
  if (typeof data === 'string') {
    return ENCODR.encode(data).byteLength
  }
  if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
    return data.byteLength
  }
  if (data instanceof Blob) {
    return data.size
  }
  throw new Error('Unsupported data type')
}

/**
 * Turn a raw ArrayBuffer into its hexadecimal representation.
 * @param {ArrayBuffer} buffer The raw bytes.
 * @returns {string} Hexadecimal string
 */
export const hexFromBuffer = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (const byte of bytes) {
    hex += HEXS[byte >> 4]! + HEXS[byte & 0x0f]!
  }
  return hex
}

/**
 * Turn a raw ArrayBuffer into its base64 representation.
 * @param {ArrayBuffer} buffer The raw bytes.
 * @returns {string} Base64 string
 */
export const base64FromBuffer = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let result = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    result += btoa(String.fromCodePoint(...chunk))
  }
  return result
}

/**
 * Compute SHA-256 hash of arbitrary string data.
 * @param {string} content The content to be hashed.
 * @returns {ArrayBuffer} The raw hash
 */
export const sha256 = async (content: string): Promise<ArrayBuffer> => {
  const data = ENCODR.encode(content)

  return await globalThis.crypto.subtle.digest('SHA-256', data)
}

/**
 * Compute HMAC-SHA-256 of arbitrary data.
 * @param {string|ArrayBuffer} key The key used to sign the content.
 * @param {string} content The content to be signed.
 * @returns {ArrayBuffer} The raw signature
 */
export const hmac = async (
  key: string | ArrayBuffer,
  content: string,
): Promise<ArrayBuffer> => {
  const secret = await globalThis.crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? ENCODR.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const data = ENCODR.encode(content)

  return await globalThis.crypto.subtle.sign('HMAC', secret, data)
}

/**
 * Sanitize ETag value by removing quotes and XML entities
 * @param etag ETag value to sanitize
 * @returns Sanitized ETag
 */
export const sanitizeETag = (etag: string): string => {
  const replaceChars: Record<string, string> = {
    '"': '',
    '&quot;': '',
    '&#34;': '',
  }
  return etag.replaceAll(
    /(^("|&quot;|&#34;))|(("|&quot;|&#34;)$)/g,
    (m) => replaceChars[m] || '',
  )
}

const entityMap = {
  '&quot;': '"',
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
} as const

/**
 * Escape special characters for XML
 * @param value String to escape
 * @returns XML-escaped string
 */
export const escapeXml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const unescapeXml = (value: string): string =>
  value.replaceAll(
    /&(quot|apos|lt|gt|amp);/g,
    (m) => entityMap[m as keyof typeof entityMap] ?? m,
  )

/**
 * Parse a very small subset of XML into a JS structure.
 *
 * @param input raw XML string
 * @returns string for leaf nodes, otherwise a map of children
 */

export const parseXml = (input: string): XmlValue => {
  const xmlContent = input.replace(/<\?xml[^?]*\?>\s*/, '')
  const RE_TAG = /<([A-Za-z_][\w\-.]*)[^>]*>([\s\S]*?)<\/\1>/gm
  const result: XmlMap = {} // strong type, no `any`
  let match: RegExpExecArray | null

  // biome-ignore lint/suspicious/noAssignInExpressions: supress
  while ((match = RE_TAG.exec(xmlContent)) !== null) {
    const tagName = match[1]
    const innerContent = match[2]
    const node: XmlValue = innerContent
      ? parseXml(innerContent)
      : unescapeXml(innerContent?.trim() || '')
    if (!tagName) {
      continue
    }
    const current = result[tagName]
    if (current === undefined) {
      // First occurrence
      result[tagName] = node
    } else if (Array.isArray(current)) {
      // Already an array
      current.push(node)
    } else {
      // Promote to array on the second occurrence
      result[tagName] = [current, node]
    }
  }

  // No child tags? — return the text, after entity decode
  return Object.keys(result).length > 0
    ? result
    : unescapeXml(xmlContent.trim())
}

/**
 * Encode a character as a URI percent-encoded hex value
 * @param c Character to encode
 * @returns Percent-encoded character
 */
const encodeAsHex = (c: string): string =>
  `%${c.charCodeAt(0).toString(16).toUpperCase()}`

/**
 * Escape a URI string using percent encoding
 * @param uriStr URI string to escape
 * @returns Escaped URI string
 */
export const uriEscape = (uriStr: string): string => {
  return encodeURIComponent(uriStr).replace(/[!'()*]/g, encodeAsHex)
}

/**
 * Escape a URI resource path while preserving forward slashes
 * @param string URI path to escape
 * @returns Escaped URI path
 */
export const uriResourceEscape = (string: string): string => {
  return uriEscape(string).replaceAll('%2F', '/')
}

export const extractErrCode = (e: unknown): string | undefined => {
  if (typeof e !== 'object' || e === null) {
    return undefined
  }
  const err = e as ErrorWithCode
  if (typeof err.code === 'string') {
    return err.code
  }
  return typeof err.cause?.code === 'string' ? err.cause.code : undefined
}

export class S3Error extends Error {
  readonly code?: string
  constructor(msg: string, code?: string, cause?: unknown) {
    super(msg)
    this.name = new.target.name // keeps instanceof usable
    this.code = code
    this.cause = cause
  }
}

export class S3NetworkError extends S3Error {}
export class S3ServiceError extends S3Error {
  readonly status: number
  readonly serviceCode?: string
  body: string | undefined
  constructor(
    msg: string,
    status: number,
    serviceCode?: string,
    body?: string,
  ) {
    super(msg, serviceCode)
    this.status = status
    this.serviceCode = serviceCode
    this.body = body
  }
}
