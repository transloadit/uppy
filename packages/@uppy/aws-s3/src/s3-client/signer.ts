/**
 * AWS Signature Version 4 Pre-signed URL Generator for S3-compatible services.
 * Generates pre-signed URLs with signature in the query string.
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
 */

import * as C from './consts.js'
import type { presignableRequest, presignedResponse } from './types.js'
import * as U from './utils.js'

export interface SignerConfig {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  endpoint: string
  service?: string
}

const DEFAULT_EXPIRES_IN = 900 // 15 minutes

/**
 * Creates a SigV4 pre-signed URL generator for S3 requests.
 * Returns a function that generates pre-signed URLs.
 */
export function createSigV4Presigner(config: SignerConfig) {
  const {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
    endpoint,
    service = C.S3_SERVICE,
  } = config

  let signingKeyDate: string | null = null
  let signingKey: ArrayBuffer | null = null

  async function getSignatureKey(dateStamp: string): Promise<ArrayBuffer> {
    const kDate = await U.hmac(`AWS4${secretAccessKey}`, dateStamp)
    const kRegion = await U.hmac(kDate, region)
    const kService = await U.hmac(kRegion, service)
    return U.hmac(kService, C.AWS_REQUEST_TYPE)
  }

  return async function presign(
    request: presignableRequest,
  ): Promise<presignedResponse> {
    const {
      method,
      key,
      uploadId,
      partNumber,
      expiresIn = DEFAULT_EXPIRES_IN,
    } = request

    // Build the URL - need to track encoded path separately because URL object decodes it
    const url = new URL(endpoint)

    // Normalize key: strip leading slashes to prevent double slashes when building path
    // e.g., endpoint "/" + key "/file.txt" should become "/file.txt", not "//file.txt"
    const normalizedKey = key ? key.replace(/^\/+/, '') : ''
    const encodedKey = normalizedKey ? U.uriResourceEscape(normalizedKey) : ''

    // Build the canonical path (must be encoded for signing)
    let canonicalPath = url.pathname
    if (encodedKey) {
      canonicalPath = canonicalPath.endsWith('/')
        ? `${canonicalPath}${encodedKey}`
        : `${canonicalPath}/${encodedKey}`
    }

    // Set URL pathname (will be decoded by URL object, but we use canonicalPath for signing)
    url.pathname = canonicalPath

    const now = new Date()
    const shortDate = now.toISOString().slice(0, 10).replace(/-/g, '')
    const fullDatetime = `${shortDate}T${now.toISOString().slice(11, 19).replace(/:/g, '')}Z`
    const credential = `${accessKeyId}/${shortDate}/${region}/${service}/${C.AWS_REQUEST_TYPE}`

    // Build query parameters for pre-signed URL
    url.searchParams.set('X-Amz-Algorithm', C.AWS_ALGORITHM)
    // UNSIGNED_PAYLOAD tells AWS not to verify the body content.
    // Required for pre-signed URLs since the body doesn't exist at signing time.
    url.searchParams.set('X-Amz-Content-Sha256', C.UNSIGNED_PAYLOAD)
    url.searchParams.set('X-Amz-Credential', credential)
    url.searchParams.set('X-Amz-Date', fullDatetime)
    url.searchParams.set('X-Amz-Expires', String(expiresIn))
    url.searchParams.set('X-Amz-SignedHeaders', 'host')

    // Add session token if present
    if (sessionToken) {
      url.searchParams.set('X-Amz-Security-Token', sessionToken)
    }

    // Add multipart-specific params
    if (uploadId) {
      url.searchParams.set('uploadId', uploadId)
    }
    if (partNumber !== undefined) {
      url.searchParams.set('partNumber', String(partNumber))
    }

    // For CreateMultipartUpload, add uploads param
    if (method === 'POST' && !uploadId) {
      url.searchParams.set('uploads', '')
    }

    // Sort query params (AWS SigV4 requires ASCII byte ordering)
    url.searchParams.sort()

    // Build canonical query string (replace + with %20 as required for AWS)
    const sortedParams = url.searchParams.toString().replace(/\+/g, '%20')

    // Build canonical request
    const canonicalHeaders = `host:${url.host}`
    const signedHeaderNames = 'host'

    const canonicalRequest = [
      method,
      canonicalPath, // Use the encoded path, not url.pathname which gets decoded
      sortedParams,
      canonicalHeaders,
      '',
      signedHeaderNames,
      C.UNSIGNED_PAYLOAD,
    ].join('\n')

    // Build string to sign
    const scope = `${shortDate}/${region}/${service}/${C.AWS_REQUEST_TYPE}`
    const stringToSign = [
      C.AWS_ALGORITHM,
      fullDatetime,
      scope,
      U.hexFromBuffer(await U.sha256(canonicalRequest)),
    ].join('\n')

    // Get/cache signing key
    if (shortDate !== signingKeyDate || !signingKey) {
      signingKeyDate = shortDate
      signingKey = await getSignatureKey(shortDate)
    }

    // Generate signature
    const signature = U.hexFromBuffer(await U.hmac(signingKey, stringToSign))

    // Build final URL with signature (use canonicalPath to preserve encoding)
    const presignedUrl = `${url.origin}${canonicalPath}?${sortedParams}&X-Amz-Signature=${signature}`

    return {
      url: presignedUrl,
    }
  }
}

// Keep the old name as an alias for backward compatibility during migration
export const createSigV4Signer = createSigV4Presigner
