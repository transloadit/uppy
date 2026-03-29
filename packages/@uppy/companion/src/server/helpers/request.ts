import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import type { LookupFunction } from 'node:net'
import path from 'node:path'
import type { Duplex } from 'node:stream'
import contentDisposition from 'content-disposition'
import got, { type Response } from 'got'
import ipaddr from 'ipaddr.js'
import validator from 'validator'

export const FORBIDDEN_IP_ADDRESS = 'Forbidden IP address'

// Example scary IPs that should return false (ipv6-to-ipv4 mapped):
// ::FFFF:127.0.0.1
// ::ffff:7f00:1
const isDisallowedIP = (ipAddress: string): boolean =>
  ipaddr.parse(ipAddress).range() !== 'unicast'

/**
 * Validates that the download URL is secure.
 *
 * @param url - The URL to validate.
 * @param allowLocalUrls - Whether to allow local addresses.
 */
const validateURL = (
  url: string | null | undefined,
  allowLocalUrls: boolean,
): boolean => {
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
      if (err) {
        callback(err, addresses, maybeFamily)
        return
      }

      const toValidate = Array.isArray(addresses)
        ? addresses
        : [{ address: addresses, family: maybeFamily }]

      // because dns.lookup seems to be called with option `all: true`, if we are on an ipv6 system,
      // `addresses` could contain a list of ipv4 addresses as well as ipv6 mapped addresses (rfc6052) which we cannot allow
      // however we should still allow any valid ipv4 addresses, so we filter out the invalid addresses
      const validAddresses = allowLocalIPs
        ? toValidate
        : toValidate.filter(({ address }) => !isDisallowedIP(address))

      const [firstValidAddress] = validAddresses
      // and check if there's anything left after we filtered:
      if (firstValidAddress == null) {
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
        : firstValidAddress.address
      callback(err, ret, maybeFamily)
    })
  }

  const shouldBlockHost = (host: string | null | undefined): host is string =>
    host != null && ipaddr.isValid(host) && isDisallowedIP(host)

  if (protocol.startsWith('https')) {
    return class HttpsAgent extends https.Agent {
      override createConnection(
        options: http.ClientRequestArgs,
        callback?: (err: Error | null, stream: Duplex) => void,
      ): Duplex {
        if (!allowLocalIPs && shouldBlockHost(options.host)) {
          const socket = undefined as unknown as Duplex // not sure about this but it's how it always worked
          callback?.(new Error(FORBIDDEN_IP_ADDRESS), socket)
          return socket
        }
        return super.createConnection(
          { ...options, lookup: dnsLookup },
          callback,
        )
      }
    }
  }

  return class HttpAgent extends http.Agent {
    override createConnection(
      options: http.ClientRequestArgs,
      callback?: (err: Error | null, stream: Duplex) => void,
    ): Duplex {
      if (!allowLocalIPs && shouldBlockHost(options.host)) {
        const socket = undefined as unknown as Duplex // not sure about this but it's how it always worked
        callback?.(new Error(FORBIDDEN_IP_ADDRESS), socket)
        return socket
      }
      return super.createConnection({ ...options, lookup: dnsLookup }, callback)
    }
  }
}

export { getProtectedHttpAgent }

function getProtectedGot({ allowLocalIPs }: { allowLocalIPs: boolean }) {
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
 * @param url - The URL to inspect.
 * @param allowLocalIPs - Whether to allow local addresses (disables SSRF protection).
 * @param options - Extra request options passed to got.
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

  async function requestWithMethod(method: 'HEAD' | 'GET') {
    const protectedGot = getProtectedGot({ allowLocalIPs })
    const stream = protectedGot.stream(url, {
      method,
      throwHttpErrors: false,
      ...options,
    })

    return new Promise<UrlMetaWithStatus>((resolve, reject) =>
      stream
        .on('response', (response: Response) => {
          // Can be undefined for unknown length URLs, e.g. transfer-encoding: chunked
          const contentLengthHeader = response.headers['content-length']
          const contentLength =
            contentLengthHeader != null
              ? parseInt(contentLengthHeader, 10)
              : NaN
          // If Content-Disposition with file name is missing, fallback to the URL path for the name,
          // but if multiple files are served via query params like foo.com?file=file-1, foo.com?file=file-2,
          // we add random string to avoid duplicate files
          const contentDispositionHeader =
            response.headers['content-disposition']
          let filename: string | undefined
          if (contentDispositionHeader != null) {
            const parsed = contentDisposition.parse(contentDispositionHeader)
            const maybeFilename = parsed.parameters['filename']
            if (maybeFilename != null) {
              filename = maybeFilename
            }
          }
          if (!filename)
            filename = path.basename(`${response.request.requestUrl}`)

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
