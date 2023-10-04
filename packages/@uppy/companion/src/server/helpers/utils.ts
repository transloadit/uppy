import type { IncomingMessage } from 'node:http'
import crypto = require('node:crypto')

export const hasMatch = (value: string, criteria: string[]): boolean => {
  return criteria.some((i) => {
    return value === i || new RegExp(i).test(value)
  })
}

export const jsonStringify = (data: object): string => {
  const cache = []
  return JSON.stringify(data, (key, value) => {
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
 * Returns a url builder
 */
export const getURLBuilder = (
  options: Record<string, unknown>,
): typeof buildURL => {
  /**
   * Builds companion targeted url
   */
  const buildURL = (
    subPath: string,
    isExternal: boolean,
    excludeHost?: boolean,
  ): string => {
    const server = options.server as Record<string, unknown>
    const { implicitPath, path: serverPath } = server

    let path = ''

    if (isExternal && implicitPath) {
      path += implicitPath
    }

    if (serverPath) {
      path += serverPath
    }

    path += subPath

    if (excludeHost) {
      return path
    }

    return `${server.protocol}://${server.host}${path}`
  }

  return buildURL
}

/**
 * Ensure that a user-provided `secret` is 32 bytes long (the length required
 * for an AES256 key) by hashing it with SHA256.
 *
 * @param {string|Buffer} secret
 */
function createSecret(secret): Buffer {
  const hash = crypto.createHash('sha256')
  hash.update(secret)
  return hash.digest()
}

/**
 * Create an initialization vector for AES256.
 */
function createIv(): Buffer {
  return crypto.randomBytes(16)
}

function urlEncode(unencoded: string): string {
  return unencoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '~')
}

function urlDecode(encoded: string): string {
  return encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/~/g, '=')
}

/**
 * Encrypt a buffer or string with AES256 and a random iv.
 *
 * @returns Ciphertext as a hex string, prefixed with 32 hex characters containing the iv.
 */
export const encrypt = (input: string, secret: string | Buffer): string => {
  const iv = createIv()
  const cipher = crypto.createCipheriv('aes256', createSecret(secret), iv)
  let encrypted = cipher.update(input, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  // add iv to encrypted string to use for decryption
  return iv.toString('hex') + urlEncode(encrypted)
}

/**
 * Decrypt an iv-prefixed or string with AES256. The iv should be in the first 32 hex characters.
 *
 * @returns Decrypted value.
 */
export const decrypt = (encrypted: string, secret: string | Buffer): string => {
  // Need at least 32 chars for the iv
  if (encrypted.length < 32) {
    throw new Error(
      'Invalid encrypted value. Maybe it was generated with an old Companion version?',
    )
  }

  // NOTE: The first 32 characters are the iv, in hex format. The rest is the encrypted string, in base64 format.
  const iv = Buffer.from(encrypted.slice(0, 32), 'hex')
  const encryptionWithoutIv = encrypted.slice(32)

  let decipher: crypto.Decipher
  try {
    decipher = crypto.createDecipheriv('aes256', createSecret(secret), iv)
  } catch (err) {
    if (err.code === 'ERR_CRYPTO_INVALID_IV') {
      throw new Error('Invalid initialization vector')
    } else {
      throw err
    }
  }

  let decrypted = decipher.update(
    urlDecode(encryptionWithoutIv),
    'base64',
    'utf8',
  )
  decrypted += decipher.final('utf8')
  return decrypted
}

export const defaultGetKey = (req: never, filename: string): string =>
  `${crypto.randomUUID()}-${filename}`

export const prepareStream = async (stream): Promise<void> =>
  new Promise((resolve, reject) =>
    stream
      .on('response', () => {
        // Don't allow any more data to flow yet.
        // https://github.com/request/request/issues/1990#issuecomment-184712275
        stream.pause()
        resolve()
      })
      .on('error', (err) => {
        // got doesn't parse body as JSON on http error (responseType: 'json' is ignored and it instead becomes a string)
        if (
          err?.request?.options?.responseType === 'json' &&
          typeof err?.response?.body === 'string'
        ) {
          try {
            // todo unit test this
            reject(
              Object.assign(new Error(), {
                response: { body: JSON.parse(err.response.body) },
              }),
            )
          } catch (err2) {
            reject(err)
          }
        } else {
          reject(err)
        }
      }),
  )

export const getBasicAuthHeader = (key: string, secret: string): string => {
  const base64 = Buffer.from(`${key}:${secret}`, 'binary').toString('base64')
  return `Basic ${base64}`
}

const rfc2047Encode = (dataIn: string): string => {
  const data = `${dataIn}`
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(data)) return data // we return ASCII as is
  return `=?UTF-8?B?${Buffer.from(data).toString('base64')}?=` // We encode non-ASCII strings
}

export const rfc2047EncodeMetadata = (
  metadata: Record<string, string>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(metadata).map((entry) => entry.map(rfc2047Encode)),
  )

export const getBucket = (
  bucketOrFn: string | ((req: IncomingMessage) => string),
  req?: IncomingMessage,
): string => {
  const bucket = typeof bucketOrFn === 'function' ? bucketOrFn(req) : bucketOrFn

  if (typeof bucket !== 'string' || bucket === '') {
    // This means a misconfiguration or bug
    throw new TypeError(
      's3: bucket key must be a string or a function resolving the bucket string',
    )
  }
  return bucket
}
