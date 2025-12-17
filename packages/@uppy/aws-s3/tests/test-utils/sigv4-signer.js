import {
  AWS_ALGORITHM,
  AWS_REQUEST_TYPE,
  HEADER_AMZ_CONTENT_SHA256,
  HEADER_AMZ_DATE,
  HEADER_HOST,
  S3_SERVICE,
  UNSIGNED_PAYLOAD,
} from '../../src/s3-client/consts'
import { hexFromBuffer, hmac, sha256 } from '../../src/s3-client/utils'
/**
 * get the url
 * create the headers object which we need to sign
 * create the sortedHeaders and ignored headers
 * build canonicalHeaders
 * build query string
 * build cannonical request
 * build string to sign
 */

/**
 * Create a SigV4 signer for AWS/S3-compatible requests.
 *
 * @param {object} options
 * @param {string} options.accessKeyId - AWS access key ID
 * @param {string} options.secretAccessKey - AWS secret access key
 * @param {string} options.region - AWS region
 * @param {string} [options.sessionToken] - Optional session token for temp credentials
 * @param {string} [options.service='s3'] - AWS service (s3 or sts)
 */
export function createSigV4Signer({
  accessKeyId,
  secretAccessKey,
  region,
  sessionToken,
  service = S3_SERVICE,
}) {
  let signingKeyDate
  let signingKey

  const getSignatureKey = async (dateStamp) => {
    const kDate = await hmac(`AWS4${secretAccessKey}`, dateStamp)
    const kRegion = await hmac(kDate, region)
    const kService = await hmac(kRegion, service)
    return await hmac(kService, AWS_REQUEST_TYPE)
  }

  return async function signRequest({ method, url, headers, body }) {
    const parsedUrl = new URL(url)

    const d = new Date()
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')

    const shortDatetime = `${year}${month}${day}`
    const fullDatetime = `${shortDatetime}T${String(d.getUTCHours()).padStart(2, '0')}${String(
      d.getUTCMinutes(),
    ).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`
    const credentialScope = `${shortDatetime}/${region}/${service}/${AWS_REQUEST_TYPE}`

    // Compute payload hash (UNSIGNED_PAYLOAD for S3, SHA256 hash for STS)
    const payloadHash = body
      ? hexFromBuffer(await sha256(body))
      : UNSIGNED_PAYLOAD

    // Headers to sign

    const signedHeadersObj = {
      ...headers,
      [HEADER_AMZ_CONTENT_SHA256]: payloadHash,
      [HEADER_AMZ_DATE]: fullDatetime,
      [HEADER_HOST]: parsedUrl.host,
      // Include session token if using temporary credentials
      ...(sessionToken ? { 'x-amz-security-token': sessionToken } : {}),
    }

    const ignoredHeaders = new Set([
      'authorization',
      'content-length',
      'content-type',
      'user-agent',
    ])

    let canonicalHeaders = ''
    let signedHeaders = ''

    const sortedHeaders = Object.entries(signedHeadersObj)
      .filter(([key]) => !ignoredHeaders.has(key.toLocaleLowerCase()))
      .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))

    for (const [key, value] of sortedHeaders) {
      const lowerKey = key.toLowerCase()
      if (canonicalHeaders) {
        canonicalHeaders += '\n'
        signedHeaders += ';'
      }
      canonicalHeaders += `${lowerKey}:${String(value).trim()}`
      signedHeaders += lowerKey
    }

    const queryParams = {}
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

    // canonical request

    const canonicalRequest = [
      method,
      parsedUrl.pathname,
      canonicalQueryString,
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n')

    // build string to sign

    const hashedCanonical = hexFromBuffer(await sha256(canonicalRequest))

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      fullDatetime,
      credentialScope,
      hashedCanonical,
    ].join('\n')

    // get key

    if (shortDatetime !== signingKeyDate || !signingKey) {
      signingKeyDate = shortDatetime
      signingKey = await getSignatureKey(shortDatetime)
    }

    // get signature
    const signature = hexFromBuffer(await hmac(signingKey, stringToSign))

    // auth header

    const authorization = `${AWS_ALGORITHM} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    return {
      ...signedHeadersObj,
      authorization: authorization,
    }
  }
}
