/**
 * AWS Signature Version 4 Signer for S3-compatible services.
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-signing.html
 */

import * as C from './consts.js'
import type { signableRequest, signedHeaders } from './types.js'
import * as U from './utils.js'

export interface SignerConfig {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  service?: string
}

/**
 * Creates a SigV4 signer for S3 requests.
 * Returns a function that can sign requests with Authorization headers.
 */
export function createSigV4Signer(config: SignerConfig) {
  const {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
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

  return async function signRequest(
    request: signableRequest,
  ): Promise<signedHeaders> {
    const { method, url, headers } = request
    const parsedUrl = new URL(url)

    const now = new Date()
    const shortDate = now.toISOString().slice(0, 10).replace(/-/g, '')
    const fullDatetime = `${shortDate}T${now.toISOString().slice(11, 19).replace(/:/g, '')}Z`
    const scope = `${shortDate}/${region}/${service}/${C.AWS_REQUEST_TYPE}`

    // const payloadHash =
    //   body && typeof body === 'string'
    //     ? U.hexFromBuffer(await U.sha256(body))
    //     : C.UNSIGNED_PAYLOAD

    // S3 supports both hashed / unhashed payload no need for hashed payload now as
    // we're not talking to sts, also it takes up CPU
    const payloadHash = C.UNSIGNED_PAYLOAD

    const headersToSign: Record<string, string> = {
      ...headers,
      [C.HEADER_AMZ_CONTENT_SHA256]: payloadHash,
      [C.HEADER_AMZ_DATE]: fullDatetime,
      [C.HEADER_HOST]: parsedUrl.host,
      ...(sessionToken ? { 'x-amz-security-token': sessionToken } : {}),
    }

    const ignored = new Set([
      'authorization',
      'content-length',
      'content-type',
      'user-agent',
    ])
    const sorted = Object.entries(headersToSign)
      .filter(([k]) => !ignored.has(k.toLowerCase()))
      .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))

    const canonicalHeaders = sorted
      .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
      .join('\n')
    const signedHeaderNames = sorted.map(([k]) => k.toLowerCase()).join(';')

    const queryString = [...parsedUrl.searchParams.entries()]
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .sort()
      .join('&')

    const canonicalRequest = [
      method,
      parsedUrl.pathname,
      queryString,
      canonicalHeaders,
      '',
      signedHeaderNames,
      payloadHash,
    ].join('\n')

    const stringToSign = [
      C.AWS_ALGORITHM,
      fullDatetime,
      scope,
      U.hexFromBuffer(await U.sha256(canonicalRequest)),
    ].join('\n')

    if (shortDate !== signingKeyDate || !signingKey) {
      signingKeyDate = shortDate
      signingKey = await getSignatureKey(shortDate)
    }

    const signature = U.hexFromBuffer(await U.hmac(signingKey, stringToSign))
    const authorization = `${C.AWS_ALGORITHM} Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`

    return { ...headersToSign, authorization }
  }
}
