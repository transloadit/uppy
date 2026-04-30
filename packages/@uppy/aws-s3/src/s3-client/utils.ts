import type { XmlMap, XmlValue } from './types.js'

export const sanitizeXmlETag = (etag: string): string =>
  etag.replace(/^(&quot;|&#34;)+|(&quot;|&#34;)+$/g, '')

export const sanitizeETag = (etag: string | null): string | undefined =>
  etag?.replace(/^"+|"+$/g, '')

/** Strips query string and hash from a URL to derive the object location. */
export function removeQueryString(urlString: string): string {
  const urlObject = new URL(urlString)
  urlObject.search = ''
  urlObject.hash = ''
  return urlObject.href
}

const textEncoder = new TextEncoder()
const HEXS = '0123456789abcdef'

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
 * Compute SHA-256 hash of arbitrary string data.
 * @param {string} content The content to be hashed.
 * @returns {ArrayBuffer} The raw hash
 */
export const sha256 = async (content: string): Promise<ArrayBuffer> => {
  const data = textEncoder.encode(content)

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
    typeof key === 'string' ? textEncoder.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const data = textEncoder.encode(content)

  return await globalThis.crypto.subtle.sign('HMAC', secret, data)
}

const entityMap = {
  '&quot;': '"',
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
} as const

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

  // biome-ignore lint/suspicious/noAssignInExpressions: suppress
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
const uriEscape = (uriStr: string): string => {
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
