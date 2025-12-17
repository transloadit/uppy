/**
 * AWS Signature Version 4 Signer for S3-compatible services.
 *
 * This signer creates signed headers for S3 API requests, supporting both
 * permanent credentials and temporary credentials (with session token).
 *
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-signing.html
 */

import * as C from './consts.js'
import * as U from './utils.js'
import type { signableRequest, signedHeaders } from './types.js'

/** Credentials for signing requests */
export interface SignerCredentials {
  accessKeyId: string
  secretAccessKey: string
  /** Optional session token for temporary credentials (from STS) */
  sessionToken?: string
}

/** Configuration for creating a SigV4 signer */
export interface SignerConfig extends SignerCredentials {
  /** AWS region (e.g., 'us-east-1') */
  region: string
  /** AWS service (defaults to 's3') */
  service?: string
}

/**
 * Creates a SigV4 signer function for AWS/S3-compatible requests.
 *
 * The returned function can be passed to S3mini as the signRequest option.
 *
 * @example
 * ```typescript
 * const signer = createSigV4Signer({
 *   accessKeyId: 'AKIA...',
 *   secretAccessKey: 'secret...',
 *   sessionToken: 'token...', // Optional, for temp credentials
 *   region: 'us-east-1',
 * })
 *
 * const s3 = new S3mini({
 *   endpoint: 'https://s3.amazonaws.com/bucket',
 *   signRequest: signer,
 * })
 * ```
 */
export function createSigV4Signer(config: SignerConfig) {
  const {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
    service = C.S3_SERVICE,
  } = config

  // Cache signing key per day
  let signingKeyDate: string | null = null
  let signingKey: ArrayBuffer | null = null

  const getSignatureKey = async (dateStamp: string): Promise<ArrayBuffer> => {
    const kDate = await U.hmac(`AWS4${secretAccessKey}`, dateStamp)
    const kRegion = await U.hmac(kDate, region)
    const kService = await U.hmac(kRegion, service)
    return await U.hmac(kService, C.AWS_REQUEST_TYPE)
  }

  return async function signRequest(
    request: signableRequest,
  ): Promise<signedHeaders> {
    const { method, url, headers, body } = request
    const parsedUrl = new URL(url)

    // Build date strings
    const d = new Date()
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')

    const shortDatetime = `${year}${month}${day}`
    const fullDatetime = `${shortDatetime}T${String(d.getUTCHours()).padStart(2, '0')}${String(
      d.getUTCMinutes(),
    ).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`
    const credentialScope = `${shortDatetime}/${region}/${service}/${C.AWS_REQUEST_TYPE}`

    // Compute payload hash (UNSIGNED_PAYLOAD for S3 streaming, SHA256 for STS/other)
    const payloadHash =
      body && typeof body === 'string'
        ? U.hexFromBuffer(await U.sha256(body))
        : C.UNSIGNED_PAYLOAD

    // Headers to sign
    const signedHeadersObj: Record<string, string> = {
      ...headers,
      [C.HEADER_AMZ_CONTENT_SHA256]: payloadHash,
      [C.HEADER_AMZ_DATE]: fullDatetime,
      [C.HEADER_HOST]: parsedUrl.host,
      // Include session token if using temporary credentials
      ...(sessionToken ? { 'x-amz-security-token': sessionToken } : {}),
    }

    // Headers to ignore when signing
    const ignoredHeaders = new Set([
      'authorization',
      'content-length',
      'content-type',
      'user-agent',
    ])

    // Build canonical headers string
    let canonicalHeaders = ''
    let signedHeaderNames = ''

    const sortedHeaders = Object.entries(signedHeadersObj)
      .filter(([key]) => !ignoredHeaders.has(key.toLowerCase()))
      .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))

    for (const [key, value] of sortedHeaders) {
      const lowerKey = key.toLowerCase()
      if (canonicalHeaders) {
        canonicalHeaders += '\n'
        signedHeaderNames += ';'
      }
      canonicalHeaders += `${lowerKey}:${String(value).trim()}`
      signedHeaderNames += lowerKey
    }

    // Build canonical query string
    const queryParams: Record<string, string> = {}
    parsedUrl.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    const canonicalQueryString = Object.keys(queryParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`,
      )
      .sort()
      .join('&')

    // Build canonical request
    const canonicalRequest = [
      method,
      parsedUrl.pathname,
      canonicalQueryString,
      canonicalHeaders,
      '',
      signedHeaderNames,
      payloadHash,
    ].join('\n')

    // Build string to sign
    const hashedCanonical = U.hexFromBuffer(await U.sha256(canonicalRequest))
    const stringToSign = [
      C.AWS_ALGORITHM,
      fullDatetime,
      credentialScope,
      hashedCanonical,
    ].join('\n')

    // Get or compute signing key (cached per day)
    if (shortDatetime !== signingKeyDate || !signingKey) {
      signingKeyDate = shortDatetime
      signingKey = await getSignatureKey(shortDatetime)
    }

    // Compute signature
    const signature = U.hexFromBuffer(await U.hmac(signingKey, stringToSign))

    // Build authorization header
    const authorization = `${C.AWS_ALGORITHM} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`

    return {
      ...signedHeadersObj,
      authorization,
    }
  }
}
