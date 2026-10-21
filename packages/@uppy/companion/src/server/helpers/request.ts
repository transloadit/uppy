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
      ): Duplex | null | undefined {
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
    ): Duplex | null | undefined {
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

export const MAX_REDIRECTS = 10

const CREDENTIAL_HEADERS = new Set(['authorization', 'cookie', 'host'])

function stripCredentialHeaders(headers: unknown): Record<string, unknown> {
  if (headers == null || typeof headers !== 'object') return {}
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !CREDENTIAL_HEADERS.has(name.toLowerCase()),
    ),
  )
}

/**
 * Opens a got stream to a client-chosen URL and resolves once response headers
 * are in, following redirects here rather than in got.
 *
 * got follows a redirect by draining the 3xx body and, when the next hop or
 * the Location URL fails, buffers whatever is left of that (decompressed) body
 * with no limit. The same happens for 4xx/5xx with throwHttpErrors. A hostile
 * server turns a 1 KB compressed body into gigabytes and aborts the process.
 * Here every 3xx response is destroyed before the next request, each hop's URL
 * is validated, and non-2xx responses are handed back for the caller to drop.
 */
export async function openProtectedStream(
  url: string,
  allowLocalIPs: boolean,
  options: Record<string, unknown> = {},
): Promise<{ stream: ReturnType<typeof got.stream>; response: Response }> {
  const protectedGot = getProtectedGot({ allowLocalIPs })
  let currentUrl = url
  let hopOptions = options
  for (let hop = 0; ; hop++) {
    const stream = protectedGot.stream(currentUrl, {
      ...hopOptions,
      throwHttpErrors: false,
      followRedirect: false,
    })
    const response = await new Promise<Response>((resolve, reject) => {
      stream.once('response', resolve)
      stream.once('error', reject)
    })
    const { statusCode } = response
    const location = response.headers['location']
    if (statusCode >= 300 && statusCode < 400 && location != null) {
      stream.destroy()
      if (hop >= MAX_REDIRECTS) throw new Error('Too many redirects')
      const nextUrl = new URL(location, currentUrl)
      if (!validateURL(nextUrl.href, allowLocalIPs)) {
        throw new Error('Redirected to an invalid URL')
      }
      if (nextUrl.origin !== new URL(currentUrl).origin) {
        // Like got: credentials given for one origin must not follow a
        // redirect to another (e.g. the Google Photos bearer token).
        hopOptions = {
          ...hopOptions,
          headers: stripCredentialHeaders(hopOptions['headers']),
        }
      }
      currentUrl = nextUrl.href
      continue
    }
    return { stream, response }
  }
}

/** Content-Length as a number, or undefined when absent or not a length. */
export function sizeFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): number | undefined {
  const raw = headers['content-length']
  const size = typeof raw === 'string' ? parseInt(raw, 10) : NaN
  return !Number.isNaN(size) && size >= 0 ? size : undefined
}

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

  async function requestWithMethod(
    method: 'HEAD' | 'GET',
  ): Promise<UrlMetaWithStatus> {
    const { stream, response } = await openProtectedStream(url, allowLocalIPs, {
      method,
      ...options,
    })
    // No need to get the rest of the response, as we only want header (not really relevant for HEAD, but why not)
    stream.destroy()

    // Can be undefined for unknown length URLs, e.g. transfer-encoding: chunked
    const contentLengthHeader = response.headers['content-length']
    const contentLength =
      contentLengthHeader != null ? parseInt(contentLengthHeader, 10) : NaN
    // If Content-Disposition with file name is missing, fallback to the URL path for the name,
    // but if multiple files are served via query params like foo.com?file=file-1, foo.com?file=file-2,
    // we add random string to avoid duplicate files
    const contentDispositionHeader = response.headers['content-disposition']
    let filename: string | undefined
    if (contentDispositionHeader != null) {
      const parsed = contentDisposition.parse(contentDispositionHeader)
      const maybeFilename = parsed.parameters['filename']
      if (maybeFilename != null) {
        filename = maybeFilename
      }
    }
    // The URL the client gave us, as before: `url` is what got reported as
    // `requestUrl` when it followed redirects itself.
    if (!filename) filename = path.basename(url)

    return {
      name: filename,
      type: response.headers['content-type'],
      size: Number.isNaN(contentLength) ? null : contentLength,
      statusCode: response.statusCode,
    }
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
