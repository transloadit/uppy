import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import path from 'node:path'
import type { Duplex } from 'node:stream'
import type { LookupFunction } from 'node:net'
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
function getProtectedHttpAgent({
  protocol,
  allowLocalIPs,
}: {
  protocol: 'http'
  allowLocalIPs: boolean
}): typeof http.Agent
function getProtectedHttpAgent({
  protocol,
  allowLocalIPs,
}: {
  protocol: 'https'
  allowLocalIPs: boolean
}): typeof https.Agent
function getProtectedHttpAgent({
  protocol,
  allowLocalIPs,
}: {
  protocol: string
  allowLocalIPs: boolean
}): typeof http.Agent | typeof https.Agent
function getProtectedHttpAgent({
  protocol,
  allowLocalIPs,
}: {
  protocol: string
  allowLocalIPs: boolean
}): typeof http.Agent | typeof https.Agent {
  const dnsLookup: LookupFunction = (hostname, options, callback) => {
    dns.lookup(hostname, options, (err, addresses, maybeFamily) => {
      const family = typeof maybeFamily === 'number' ? maybeFamily : 0

      const wantAll = typeof options === 'object' && options != null && options.all === true
      const errorAddressFallback = wantAll ? [] : ''

      if (err) {
        callback(err, errorAddressFallback, family)
        return
      }

      if (Array.isArray(addresses)) {
        const valid = allowLocalIPs
          ? addresses
          : addresses.filter(({ address }) => !isDisallowedIP(address))

        if (valid.length === 0) {
          callback(
            new Error(
              `Forbidden resolved IP address ${hostname} -> ${addresses.map(({ address }) => address).join(', ')}`,
            ),
            [],
            family,
          )
          return
        }

        callback(null, valid, family)
        return
      }

      // `addresses` is a single string when `options.all !== true`.
      const address = addresses
      if (!allowLocalIPs && isDisallowedIP(address)) {
        callback(
          new Error(`Forbidden resolved IP address ${hostname} -> ${address}`),
          '',
          family,
        )
        return
      }
      callback(null, address, family)
    })
  }

  const shouldBlockHost = (host: unknown): host is string =>
    typeof host === 'string' && ipaddr.isValid(host) && isDisallowedIP(host)

  if (protocol.startsWith('https')) {
    return class HttpsAgent extends https.Agent {
      createConnection(
        options: http.ClientRequestArgs,
        callback?: (err: Error | null, stream: Duplex) => void,
      ): Duplex {
        if (!allowLocalIPs && shouldBlockHost(options.host)) {
          const err = new Error(FORBIDDEN_IP_ADDRESS)
          const socket = new net.Socket()
          // Avoid emitting an unhandled 'error' event on the socket; the request
          // should fail via the callback error.
          socket.destroy()
          callback?.(err, socket)
          return socket
        }
        return super.createConnection({ ...options, lookup: dnsLookup }, callback)
      }
    }
  }

  return class HttpAgent extends http.Agent {
    createConnection(
      options: http.ClientRequestArgs,
      callback?: (err: Error | null, stream: Duplex) => void,
    ): Duplex {
      if (!allowLocalIPs && shouldBlockHost(options.host)) {
        const err = new Error(FORBIDDEN_IP_ADDRESS)
        const socket = new net.Socket()
        // Avoid emitting an unhandled 'error' event on the socket; the request
        // should fail via the callback error.
        socket.destroy()
        callback?.(err, socket)
        return socket
      }
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
  url: string,
  allowLocalIPs = false,
  options: Record<string, unknown> | undefined = undefined,
) {
  type UrlMetaWithStatus = {
    name: string
    type: string | undefined
    size: number | null
    statusCode: number
  }

  async function requestWithMethod(method: 'HEAD' | 'GET'): Promise<UrlMetaWithStatus> {
    const protectedGot = getProtectedGot({ allowLocalIPs })
    const stream = protectedGot.stream(url, {
      method,
      throwHttpErrors: false,
      ...options,
    })

    return new Promise<UrlMetaWithStatus>((resolve, reject) =>
      stream
        .on('response', (response) => {
          // Can be undefined for unknown length URLs, e.g. transfer-encoding: chunked
          const contentLengthHeader = response.headers['content-length']
          const contentLength =
            typeof contentLengthHeader === 'string'
              ? parseInt(contentLengthHeader, 10)
              : NaN
          // If Content-Disposition with file name is missing, fallback to the URL path for the name,
          // but if multiple files are served via query params like foo.com?file=file-1, foo.com?file=file-2,
          // we add random string to avoid duplicate files
          const contentDispositionHeader = response.headers['content-disposition']
          const filename =
            typeof contentDispositionHeader === 'string'
              ? contentDisposition.parse(contentDispositionHeader).parameters.filename
            : path.basename(`${response.request.requestUrl}`)

          // No need to get the rest of the response, as we only want header (not really relevant for HEAD, but why not)
          stream.destroy()

          resolve({
            name: filename,
            type:
              typeof response.headers['content-type'] === 'string'
                ? response.headers['content-type']
                : undefined,
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
