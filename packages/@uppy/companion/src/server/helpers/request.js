import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import contentDisposition from 'content-disposition'
import got from 'got'
import ipaddr from 'ipaddr.js'
import validator from 'validator'

export const FORBIDDEN_IP_ADDRESS = 'Forbidden IP address'

// Example scary IPs that should return false (ipv6-to-ipv4 mapped):
// ::FFFF:127.0.0.1
// ::ffff:7f00:1
const isDisallowedIP = (ipAddress) =>
  ipaddr.parse(ipAddress).range() !== 'unicast'

/**
 * Validates that the download URL is secure
 *
 * @param {string} url the url to validate
 * @param {boolean} allowLocalUrls whether to allow local addresses
 */
const validateURL = (url, allowLocalUrls) => {
  if (!url) {
    return false
  }

  const validURLOpts = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: !allowLocalUrls,
  }
  if (!validator.isURL(url, validURLOpts)) {
    return false
  }

  return true
}

export { validateURL }

/**
 * Returns http Agent that will prevent requests to private IPs (to prevent SSRF)
 */
const getProtectedHttpAgent = ({ protocol, allowLocalIPs }) => {
  function dnsLookup(hostname, options, callback) {
    dns.lookup(hostname, options, (err, addresses, maybeFamily) => {
      if (err) {
        callback(err, addresses, maybeFamily)
        return
      }

      const toValidate = Array.isArray(addresses)
        ? addresses
        : [{ address: addresses }]
      // because dns.lookup seems to be called with option `all: true`, if we are on an ipv6 system,
      // `addresses` could contain a list of ipv4 addresses as well as ipv6 mapped addresses (rfc6052) which we cannot allow
      // however we should still allow any valid ipv4 addresses, so we filter out the invalid addresses
      const validAddresses = allowLocalIPs
        ? toValidate
        : toValidate.filter(({ address }) => !isDisallowedIP(address))

      // and check if there's anything left after we filtered:
      if (validAddresses.length === 0) {
        callback(
          new Error(
            `Forbidden resolved IP address ${hostname} -> ${toValidate.map(({ address }) => address).join(', ')}`,
          ),
          addresses,
          maybeFamily,
        )
        return
      }

      const ret = Array.isArray(addresses)
        ? validAddresses
        : validAddresses[0].address
      callback(err, ret, maybeFamily)
    })
  }

  return class HttpAgent extends (protocol.startsWith('https') ? https : http)
    .Agent {
    createConnection(options, callback) {
      if (
        ipaddr.isValid(options.host) &&
        !allowLocalIPs &&
        isDisallowedIP(options.host)
      ) {
        callback(new Error(FORBIDDEN_IP_ADDRESS))
        return undefined
      }
      // @ts-ignore
      return super.createConnection({ ...options, lookup: dnsLookup }, callback)
    }
  }
}

export { getProtectedHttpAgent }

function getProtectedGot({ allowLocalIPs }) {
  const HttpAgent = getProtectedHttpAgent({ protocol: 'http', allowLocalIPs })
  const HttpsAgent = getProtectedHttpAgent({
    protocol: 'https',
    allowLocalIPs,
  })
  const httpAgent = new HttpAgent()
  const httpsAgent = new HttpsAgent()

  // @ts-ignore
  return got.extend({ agent: { http: httpAgent, https: httpsAgent } })
}

export { getProtectedGot }

/**
 * Gets the size and content type of a url's content
 *
 * @param {string} url
 * @param {boolean} allowLocalIPs
 * @returns {Promise<{name: string, type: string, size: number}>}
 */
export async function getURLMeta(
  url,
  allowLocalIPs = false,
  options = undefined,
) {
  async function requestWithMethod(method) {
    const protectedGot = getProtectedGot({ allowLocalIPs })
    const stream = protectedGot.stream(url, {
      method,
      throwHttpErrors: false,
      ...options,
    })

    return new Promise((resolve, reject) =>
      stream
        .on('response', (response) => {
          // Can be undefined for unknown length URLs, e.g. transfer-encoding: chunked
          const contentLength = parseInt(response.headers['content-length'], 10)
          // If Content-Disposition with file name is missing, fallback to the URL path for the name,
          // but if multiple files are served via query params like foo.com?file=file-1, foo.com?file=file-2,
          // we add random string to avoid duplicate files
          const filename = response.headers['content-disposition']
            ? contentDisposition.parse(response.headers['content-disposition'])
                .parameters.filename
            : path.basename(`${response.request.requestUrl}`)

          // No need to get the rest of the response, as we only want header (not really relevant for HEAD, but why not)
          stream.destroy()

          resolve({
            name: filename,
            type: response.headers['content-type'],
            size: Number.isNaN(contentLength) ? null : contentLength,
            statusCode: response.statusCode,
          })
        })
        .on('error', (err) => {
          reject(err)
        }),
    )
  }

  // We prefer to use a HEAD request, as it doesn't download the content. If the URL doesn't
  // support HEAD, or doesn't follow the spec and provide the correct Content-Length, we
  // fallback to GET.
  let urlMeta = await requestWithMethod('HEAD')

  // If HTTP error response, we retry with GET, which may work on non-compliant servers
  // (e.g. HEAD doesn't work on signed S3 URLs)
  // We look for status codes in the 400 and 500 ranges here, as 3xx errors are
  // unlikely to have to do with our choice of method
  // todo add unit test for this
  if (urlMeta.statusCode >= 400 || urlMeta.size === 0 || urlMeta.size == null) {
    urlMeta = await requestWithMethod('GET')
  }

  if (urlMeta.statusCode >= 300) {
    throw new Error(`URL server responded with status: ${urlMeta.statusCode}`)
  }

  const { name, size, type } = urlMeta
  return { name, size, type }
}
