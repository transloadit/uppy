/**
 * Smart CDN URL signing in the browser, on top of `@transloadit/utils`'
 * isomorphic (WebCrypto) `getSignedSmartCdnUrl` — the same string-to-sign
 * and HMAC as its Node twin and api2's `Signature.getSmartCDNUrl`.
 *
 * The only addition here is `endpoint`: point the URL at a local api2's URL
 * Transform (`https://api2-devdock.transloadit.dev/file/{workspace}`)
 * instead of `https://{workspace}.tlcdn.com`. The signature does not cover
 * the host, so swapping it keeps the URL valid.
 */
import {
  getSignedSmartCdnUrl as getTlcdnUrl,
  type SmartCdnUrlOptions as UtilsSmartCdnUrlOptions,
} from '@transloadit/utils'

export type SmartCdnUrlOptions = UtilsSmartCdnUrlOptions & {
  /**
   * Base URL that precedes `/{template}/{input}`. Defaults to
   * `https://{workspace}.tlcdn.com`.
   */
  endpoint?: string
}

export async function getSignedSmartCdnUrl(
  options: SmartCdnUrlOptions,
): Promise<string> {
  const { endpoint, ...utilsOptions } = options
  const url = await getTlcdnUrl(utilsOptions)
  if (!endpoint) return url
  const { origin } = new URL(url)
  return `${endpoint.replace(/\/$/, '')}${url.slice(origin.length)}`
}
