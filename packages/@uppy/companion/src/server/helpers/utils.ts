import crypto from 'node:crypto'
import type { Request } from 'express'
import type { GetBucketFn } from '../../schemas/companion.js'

const authTagLength = 16
const nonceLength = 16
const encryptionKeyLength = 32
const ivLength = 12

/**
 * Marks an allowlist entry as a pattern rather than a literal value.
 *
 * Standalone can only ever produce strings -- `COMPANION_UPLOAD_URLS` and
 * `COMPANION_DOMAINS` split on `,`, and the JSON config file holds JSON -- so
 * without a marker there is no way to express a pattern short of configuring
 * Companion programmatically.
 * An explicit prefix is used rather than sniffing for regex metacharacters,
 * because sniffing cannot tell a pattern from a literal URL that happens to
 * contain the same character.
 *
 * `uploadUrls` patterns are tested against the whole URL exactly as written;
 * `validHosts` patterns must match a whole hostname, so they are anchored.
 */
export const patternPrefix = 're:'

/**
 * Compiles a `re:` entry. Whether the pattern is *correct* is up to whoever
 * wrote it -- see the README on the mistakes that make one match hosts it was
 * not meant to. Those cannot be detected reliably, and unlike every other way
 * of getting this wrong they fail open rather than closed, so the README is
 * where they are addressed.
 */
export const compileUploadUrlPattern = (entry: string): RegExp => {
  const body = entry.slice(patternPrefix.length)
  try {
    return new RegExp(body)
  } catch (cause) {
    throw new Error(
      `uploadUrls entry "${entry}" is not a valid regular expression: ${(cause as Error).message}`,
    )
  }
}

// Entries come from config and so are few and fixed, but matching happens per
// request; compiling each time would be wasteful.
const uploadUrlPatternCache = new Map<string, RegExp>()

const getUploadUrlPattern = (entry: string): RegExp => {
  let compiled = uploadUrlPatternCache.get(entry)
  if (compiled == null) {
    compiled = compileUploadUrlPattern(entry)
    uploadUrlPatternCache.set(entry, compiled)
  }
  return compiled
}

/**
 * Checks whether a URL matches a single `uploadUrls` allowlist entry.
 *
 * `RegExp` entries, and strings prefixed with `re:`, are tested as written,
 * against the whole URL. Every other string is compared literally: same origin,
 * and the path must match at a path boundary. Plain strings are deliberately
 * *not* compiled into regexes -- that made every string an unanchored pattern,
 * so any URL merely containing an allowed URL anywhere (in its path, query or
 * fragment) passed the check, which let a caller point Companion at an
 * arbitrary internal host. See
 * https://github.com/transloadit/uppy/issues/6480
 */
const matchesUploadUrl = (
  value: string,
  criterion: string | RegExp,
): boolean => {
  if (criterion instanceof RegExp) return criterion.test(value)

  if (criterion.startsWith(patternPrefix)) {
    return getUploadUrlPattern(criterion).test(value)
  }

  if (value === criterion) return true

  let url: URL
  let allowed: URL
  try {
    url = new URL(value)
    allowed = new URL(criterion)
  } catch {
    // A non-absolute entry can only ever match exactly, which we checked above.
    return false
  }

  // `origin` is the string "null" for non-special schemes, which would make
  // two otherwise unrelated URLs compare equal.
  if (url.origin === 'null' || url.origin !== allowed.origin) return false

  // An entry without a path (`https://example.com`) allows the whole origin.
  const allowedPath = allowed.pathname
  if (allowedPath === '/') return true

  if (url.pathname === allowedPath) return true
  return url.pathname.startsWith(
    allowedPath.endsWith('/') ? allowedPath : `${allowedPath}/`,
  )
}

/**
 * Checks a URL against the `uploadUrls` allowlist.
 */
export const hasUploadUrlMatch = (
  value: string,
  criteria: ReadonlyArray<string | RegExp>,
): boolean => criteria.some((i) => matchesUploadUrl(value, i))

/**
 * Checks a hostname against the `server.validHosts` allowlist.
 *
 * Strings prefixed with `re:` are patterns, every other string is compared
 * literally. Which of the two an entry is used to be inferred by looking for
 * regex metacharacters, which could only ever be a guess: it could not tell
 * `[dp]ev.example.com` from a hostname, and it read a `.` as a literal dot in
 * one entry and as "any character" in the next.
 *
 * A pattern is anchored. `validHosts` gates the OAuth redirect, and a host is
 * either in the set or it is not -- there is nothing a partial match could
 * usefully mean, and an unanchored one would let `example.com` admit
 * `example.com.evil.com` and take the authorization code with it.
 */
export const hasHostMatch = (
  value: string,
  criteria: ReadonlyArray<string | RegExp>,
): boolean =>
  criteria.some((i) => {
    if (i instanceof RegExp) return i.test(value)
    if (i.startsWith(patternPrefix)) {
      return new RegExp(`^(?:${i.slice(patternPrefix.length)})$`).test(value)
    }
    return value.toLowerCase() === i.toLowerCase()
  })

export const jsonStringify = (data: unknown): string => {
  const cache: unknown[] = []
  return JSON.stringify(data, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return undefined
      }
      cache.push(value)
    }
    return value
  })
}

// all paths are assumed to be '/' prepended

/**
 * Returns a URL builder.
 *
 * The returned function builds Companion-targeted URLs, optionally including the
 * server protocol/host for external use.
 */
export function getURLBuilder(options: {
  server?: {
    protocol?: string | undefined
    host?: string | undefined
    path?: string | undefined
    implicitPath?: string | undefined
  }
}) {
  return (
    subPath: string,
    isExternal: boolean,
    excludeHost?: boolean,
  ): string => {
    const server = options.server ?? {}
    let path = ''

    if (isExternal && server.implicitPath) path += server.implicitPath
    if (server.path) path += server.path
    path += subPath

    if (excludeHost) return path

    return `${server.protocol}://${server.host}${path}`
  }
}

export const getRedirectPath = (providerName: string): string =>
  `/${providerName}/redirect`

/**
 * Create an AES-CCM encryption key and initialization vector from the provided
 * secret and a random nonce.
 */
function createSecrets(
  secret: string | Buffer,
  nonce: Buffer | undefined,
): { key: Buffer; iv: Buffer } {
  const key = crypto.hkdfSync(
    'sha256',
    secret,
    new Uint8Array(32),
    nonce ?? new Uint8Array(0),
    encryptionKeyLength + ivLength,
  )
  const buf = Buffer.from(key)
  return {
    key: buf.subarray(0, encryptionKeyLength),
    iv: buf.subarray(encryptionKeyLength, encryptionKeyLength + ivLength),
  }
}

/**
 * Encrypt a string with AES-256-CCM and a random nonce.
 * Ciphertext as a hex string, prefixed with 32 hex characters containing the iv.
 *
 * The returned ciphertext is prefixed with the nonce (hex), followed by the
 * encrypted data (base64url).
 */
export const encrypt = (input: string, secret: string | Buffer): string => {
  const nonce = crypto.randomBytes(nonceLength)
  const { key, iv } = createSecrets(secret, nonce)
  const cipher = crypto.createCipheriv('aes-256-ccm', key, iv, {
    authTagLength,
  })
  const encrypted = Buffer.concat([
    cipher.update(input, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ])
  return `${nonce.toString('hex')}${encrypted.toString('base64url')}`
}

/**
 * Decrypt a nonce-prefixed ciphertext produced by {@link encrypt}.
 * The iv should be in the first 32 hex characters.
 */
export const decrypt = (encrypted: string, secret: string | Buffer): string => {
  const nonceHexLength = nonceLength * 2 // because hex encoding uses 2 bytes per byte
  // NOTE: The first 32 characters are the nonce, in hex format.
  const nonce = Buffer.from(encrypted.slice(0, nonceHexLength), 'hex')
  // The rest is the encrypted string, in base64url format.
  const encryptionWithoutNonce = Buffer.from(
    encrypted.slice(nonceHexLength),
    'base64url',
  )
  // The last 16 bytes of the rest is the authentication tag
  const authTag = encryptionWithoutNonce.subarray(-authTagLength)
  // and the rest (from beginning) is the encrypted data
  const encryptionWithoutNonceAndTag = encryptionWithoutNonce.subarray(
    0,
    -authTagLength,
  )

  if (nonce.length < nonceLength) {
    throw new Error(
      'Invalid encrypted value. Maybe it was generated with an old Companion version?',
    )
  }

  const { key, iv } = createSecrets(secret, nonce)

  const decipher = crypto.createDecipheriv('aes-256-ccm', key, iv, {
    authTagLength,
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encryptionWithoutNonceAndTag),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

export const defaultGetKey = ({ filename }: { filename: string }): string => {
  return `${crypto.randomUUID()}-${filename}`
}

/**
 * Our own HttpError in cases where we can't use `got`'s `HTTPError`.
 */
export class HttpError extends Error {
  statusCode: number

  responseJson: unknown

  constructor({
    statusCode,
    responseJson,
  }: { statusCode: number; responseJson: unknown }) {
    super(`Request failed with status ${statusCode}`)
    this.statusCode = statusCode
    this.responseJson = responseJson
    this.name = 'HttpError'
  }
}

type ResponseLike = { headers: Record<string, string | string[] | undefined> }
type StreamLike = NodeJS.ReadableStream & {
  pause: () => void
  on: {
    (event: 'response', handler: (response: ResponseLike) => void): StreamLike
    (event: 'error', handler: (err: unknown) => void): StreamLike
  }
}

export const prepareStream = async (
  stream: StreamLike,
): Promise<{ size: number | undefined }> =>
  new Promise((resolve, reject) => {
    stream
      .on('response', (response) => {
        const contentLengthStr = response.headers['content-length']
        const contentLength =
          typeof contentLengthStr === 'string'
            ? parseInt(contentLengthStr, 10)
            : NaN
        const size =
          !Number.isNaN(contentLength) && contentLength >= 0
            ? contentLength
            : undefined
        // Don't allow any more data to flow yet.
        stream.pause()
        resolve({ size })
      })
      .on('error', (err) => {
        if (!err || typeof err !== 'object' || !('response' in err)) {
          reject(err)
          return
        }

        const response = err.response
        if (!response || typeof response !== 'object') {
          reject(err)
          return
        }

        const body = (response as { body?: unknown }).body
        const statusCode = (response as { statusCode?: unknown }).statusCode
        if (typeof body === 'string' && typeof statusCode === 'number') {
          // In this case the error object is not a normal GOT HTTPError where json is already parsed,
          // we use our own HttpError error for this scenario.
          try {
            const responseJson: unknown = JSON.parse(body)
            reject(new HttpError({ statusCode, responseJson }))
            return
          } catch {
            reject(err)
            return
          }
        }

        reject(err)
      })
  })

export const getBasicAuthHeader = (
  key: string | undefined,
  secret: string | undefined,
): string => {
  const base64 = Buffer.from(`${key}:${secret}`, 'binary').toString('base64')
  return `Basic ${base64}`
}

const rfc2047Encode = (dataIn: unknown): string => {
  const data = String(dataIn)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: leave it for now
  if (/^[\x00-\x7F]*$/.test(data)) return data // we return ASCII as is
  return `=?UTF-8?B?${Buffer.from(data).toString('base64')}?=` // We encode non-ASCII strings
}

export const rfc2047EncodeMetadata = (
  metadata: Record<string, unknown>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      rfc2047Encode(key),
      rfc2047Encode(value),
    ]),
  )

export const getBucket = ({
  bucketOrFn,
  req,
  metadata,
  filename,
}: {
  bucketOrFn: string | GetBucketFn | undefined
  req: Request
  metadata?: Record<string, unknown>
  filename?: string
}): string => {
  const bucket =
    typeof bucketOrFn === 'function'
      ? bucketOrFn({ req, metadata: metadata ?? {}, filename })
      : bucketOrFn

  if (typeof bucket !== 'string' || bucket === '') {
    // This means a misconfiguration or bug
    throw new TypeError(
      's3: bucket key must be a string or a function resolving the bucket string',
    )
  }
  return bucket
}

export const truncateFilename = (
  filename: string,
  maxFilenameLength?: number,
): string => {
  if (
    maxFilenameLength == null ||
    !Number.isFinite(maxFilenameLength) ||
    maxFilenameLength <= 0
  ) {
    // Historically, passing `undefined` resulted in no truncation (slice(0)).
    return filename
  }
  return filename.slice(maxFilenameLength * -1)
}
