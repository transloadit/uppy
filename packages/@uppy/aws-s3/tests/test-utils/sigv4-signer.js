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

// ! WIP
export function createSigV4Signer({ accessKeyId, secretAccessKey, region }) {
  //
  let signingKeyDate
  let signingKey

  const getSignatureKey = async (dateStamp) => {
    const kDate = await hmac(`AWS4${secretAccessKey}`, dateStamp)
    const kRegion = await hmac(kDate, region)
    const kService = await hmac(kRegion, S3_SERVICE)
    return await hmac(kService, AWS_REQUEST_TYPE)
  }

  return async function signRequest({ method, url, headers }) {
    const parsedUrl = new URL(url)

    const d = new Date()
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')

    const shortDatetime = `${year}${month}${day}`
    const fullDatetime = `${shortDatetime}T${String(d.getUTCHours()).padStart(2, '0')}${String(
      d.getUTCMinutes(),
    ).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`
    const credentialScope = `${shortDatetime}/${region}/${S3_SERVICE}/${AWS_REQUEST_TYPE}`

    // Headers to sign

    const signedHeadersObj = {
      ...headers,
      [HEADER_AMZ_CONTENT_SHA256]: UNSIGNED_PAYLOAD,
      [HEADER_AMZ_DATE]: fullDatetime,
      [HEADER_HOST]: parsedUrl.host,
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
      UNSIGNED_PAYLOAD,
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
