import crypto from 'node:crypto'
import type { Request } from 'express'
import type { GetBucketFn } from '../../schemas/companion.js'

const authTagLength = 16
const nonceLength = 16
const encryptionKeyLength = 32
const ivLength = 12

/**
 * Characters that have no place in a literal URL or hostname, but do in a
 * regular expression. Used to detect allowlist entries that were written as
 * patterns, back when string entries were compiled into regexes.
 */
export const regexMetaCharacters = /[*+?^${}()|\\]/

/**
 * Marks an `uploadUrls` entry as a pattern rather than a literal URL.
 *
 * Standalone can only ever produce strings -- `COMPANION_UPLOAD_URLS` splits
 * on `,`, and the JSON config file holds JSON -- so without a marker there is
 * no way to express a pattern short of configuring Companion programmatically.
 * An explicit prefix is used rather than sniffing for regex metacharacters,
 * because sniffing cannot tell a pattern from a literal URL that happens to
 * contain the same character.
 *
 * A pattern is tested against the whole URL, as written. That is expressive but
 * unforgiving: see `findUploadUrlPatternPitfalls` for the mistakes that turn a
 * pattern into an open redirect, which are reported at startup.
 */
export const uploadUrlPatternPrefix = 're:'

/**
 * Compiles a `re:` entry. Throws if it cannot be a working pattern at all;
 * mistakes that merely make it *too permissive* are reported separately, by
 * `findUploadUrlPatternPitfalls`.
 */
export const compileUploadUrlPattern = (entry: string): RegExp => {
  const body = entry.slice(uploadUrlPatternPrefix.length)

  // A list is comma-separated and is split before we get here, so a `{n,m}`
  // quantifier in a list entry would already have been torn in half. That half
  // often still compiles -- `{1` is a literal brace under Annex B -- and would
  // silently mean something other than what was written, so reject it.
  const unescaped = body.replace(/\\./g, '')
  if (
    (unescaped.match(/{/g)?.length ?? 0) !==
    (unescaped.match(/}/g)?.length ?? 0)
  ) {
    throw new Error(
      `uploadUrls entry "${entry}" has an unbalanced "{". A comma inside a pattern in a list is not supported, because the list is comma-separated -- put the pattern on its own in COMPANION_UPLOAD_URLS, where it is not split, or write "(?:ab|abc)" rather than "a{1,2}b".`,
    )
  }

  try {
    return new RegExp(body)
  } catch (cause) {
    throw new Error(
      `uploadUrls entry "${entry}" is not a valid regular expression: ${(cause as Error).message}`,
    )
  }
}

/**
 * Finds the host portion of a pattern: what sits between `://` and the `/` that
 * begins the path. Escapes and character classes are stepped over, so a `/`
 * inside `[...]` does not end the host. `\/` counts as a `/`, since patterns are
 * often written with the slashes escaped.
 */
const findPatternHost = (
  body: string,
): { host: string; terminated: boolean } | null => {
  const scheme = /^\^?[a-zA-Z][a-zA-Z0-9+.-]*:(?:\\\/|\/){2}/.exec(body)
  if (scheme == null) return null

  const start = scheme[0].length
  let inClass = false
  for (let i = start; i < body.length; i += 1) {
    const char = body[i]
    if (char === '\\') {
      if (body[i + 1] === '/' && !inClass) {
        return { host: body.slice(start, i), terminated: true }
      }
      i += 1
      continue
    }
    if (inClass) {
      if (char === ']') inClass = false
      continue
    }
    if (char === '[') {
      inClass = true
      continue
    }
    if (char === '/') return { host: body.slice(start, i), terminated: true }
  }
  return { host: body.slice(start), terminated: false }
}

/** Whether a `.` appears outside a character class, where it means "any character". */
const hasWildcardDot = (pattern: string): boolean => {
  let inClass = false
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i]
    if (char === '\\') {
      i += 1
      continue
    }
    if (inClass) {
      if (char === ']') inClass = false
      continue
    }
    if (char === '[') {
      inClass = true
      continue
    }
    if (char === '.') return true
  }
  return false
}

/**
 * Reports the mistakes that make a `uploadUrls` pattern match hosts it was
 * never meant to. A pattern is matched against the whole URL, so all three of
 * these let an attacker choose the host Companion uploads to -- which is the
 * bug this allowlist exists to prevent. See
 * https://github.com/transloadit/uppy/issues/6480
 *
 * These are warnings rather than errors: the checks are heuristics, and a
 * pattern is an explicit opt-in by someone who may have a reason we cannot see.
 */
export const findUploadUrlPatternPitfalls = (entry: string): string[] => {
  const body = entry.slice(uploadUrlPatternPrefix.length)
  const pitfalls: string[] = []

  if (!body.startsWith('^')) {
    pitfalls.push(
      `it is not anchored, so it matches any URL that merely *contains* it -- "http://169.254.169.254/?x=<an allowed url>" would pass. Start it with "^".`,
    )
  }

  const parsed = findPatternHost(body)
  if (parsed == null) {
    pitfalls.push(
      `it does not look like "^scheme://host/path", so it cannot be checked for the mistakes that let an attacker choose the host.`,
    )
    return pitfalls
  }

  if (hasWildcardDot(parsed.host)) {
    pitfalls.push(
      `its host part contains an unescaped ".", which matches any character including "/" and "@", so "https://evil.example/x.your-host.com/" can satisfy it. Escape it as "\\." or use a character class.`,
    )
  }

  if (!parsed.terminated && !body.endsWith('$')) {
    pitfalls.push(
      `its host part is not terminated by "/" or "$", so it also matches a longer host -- "https://your-host.com.evil.example/" and "https://your-host.com@evil.example/" would pass. End the host with "/".`,
    )
  }

  return pitfalls
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

  if (criterion.startsWith(uploadUrlPatternPrefix)) {
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
 * Entries without regex metacharacters are compared literally. Entries that
 * are patterns -- which the docs explicitly allow, e.g. `(\w+).example.com` --
 * are anchored, so that a pattern can no longer match a host that merely
 * *contains* it (`example.com` used to match `example.com.evil.com`).
 * `RegExp` entries are tested as-is.
 */
export const hasHostMatch = (
  value: string,
  criteria: ReadonlyArray<string | RegExp>,
): boolean =>
  criteria.some((i) => {
    if (i instanceof RegExp) return i.test(value)
    if (!regexMetaCharacters.test(i)) {
      return value.toLowerCase() === i.toLowerCase()
    }
    return new RegExp(`^(?:${i})$`).test(value)
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
