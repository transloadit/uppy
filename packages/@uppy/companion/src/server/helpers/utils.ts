import crypto from 'node:crypto'
import type { Request } from 'express'

const authTagLength = 16
const nonceLength = 16
const encryptionKeyLength = 32
const ivLength = 12

export const hasMatch = (
  value: string,
  criteria: ReadonlyArray<string | RegExp>,
): boolean => {
  return criteria.some((i) => {
    if (i instanceof RegExp) return i.test(value)
    return value === i || new RegExp(i).test(value)
  })
}

export const jsonStringify = (data: unknown): string => {
  const cache: unknown[] = []
  return JSON.stringify(data, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) return undefined
      cache.push(value)
    }
    return value
  })
}

// all paths are assumed to be '/' prepended
export type UrlBuilderOptions = {
  server?: {
    protocol?: string | undefined
    host?: string | undefined
    path?: string | undefined
    implicitPath?: string | undefined
  }
}

/**
 * Returns a URL builder.
 *
 * The returned function builds Companion-targeted URLs, optionally including the
 * server protocol/host for external use.
 */
export function getURLBuilder(options: UrlBuilderOptions) {
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
 */
export const decrypt = (encrypted: string, secret: string | Buffer): string => {
  const nonceHexLength = nonceLength * 2
  const nonce = Buffer.from(encrypted.slice(0, nonceHexLength), 'hex')
  const encryptionWithoutNonce = Buffer.from(
    encrypted.slice(nonceHexLength),
    'base64url',
  )
  const authTag = encryptionWithoutNonce.subarray(-authTagLength)
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
        stream.pause()
        resolve({ size })
      })
      .on('error', (err) => {
        if (!err || typeof err !== 'object' || !('response' in err)) {
          reject(err)
          return
        }

        const response = (err as { response?: unknown }).response
        if (!response || typeof response !== 'object') {
          reject(err)
          return
        }

        const body = (response as { body?: unknown }).body
        const statusCode = (response as { statusCode?: unknown }).statusCode
        if (typeof body === 'string' && typeof statusCode === 'number') {
          try {
            const responseJson = JSON.parse(body) as unknown
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

export const getBasicAuthHeader = (key: string, secret: string): string => {
  const base64 = Buffer.from(`${key}:${secret}`, 'binary').toString('base64')
  return `Basic ${base64}`
}

const rfc2047Encode = (dataIn: unknown): string => {
  const data = `${dataIn}`
  // biome-ignore lint/suspicious/noControlCharactersInRegex: leave it for now
  if (/^[\x00-\x7F]*$/.test(data)) return data
  return `=?UTF-8?B?${Buffer.from(data).toString('base64')}?=`
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
  bucketOrFn: unknown
  req: Request
  metadata?: Record<string, unknown>
  filename?: string
}): string => {
  const bucket =
    typeof bucketOrFn === 'function'
      ? bucketOrFn({ req, metadata: metadata ?? {}, filename })
      : bucketOrFn

  if (typeof bucket !== 'string' || bucket === '') {
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
    typeof maxFilenameLength !== 'number' ||
    !Number.isFinite(maxFilenameLength) ||
    maxFilenameLength <= 0
  ) {
    // Historically, passing `undefined` resulted in no truncation (slice(0)).
    return filename
  }
  return filename.slice(maxFilenameLength * -1)
}
