/**
 * Smart CDN URL signing in the browser (WebCrypto HMAC-SHA256). Byte-compatible
 * with `getSignedSmartCdnUrl` from `@transloadit/utils/node` and the api2
 * `Signature.getSmartCDNUrl` implementation.
 */
export interface SmartCdnUrlOptions {
  workspace: string
  template: string
  input: string
  urlParams?: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  >
  /** ms since epoch; defaults to now + 1 hour. */
  expiresAt?: number
  authKey?: string
  authSecret?: string
  /**
   * Base URL that precedes `/{template}/{input}`. Defaults to
   * `https://{workspace}.tlcdn.com`. For a local api2 use e.g.
   * `https://api2-devdock.transloadit.dev/file/{workspace}`.
   */
  endpoint?: string
}

import { hmacSha256Sync } from './sha256.js'

const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')

export async function hmacSha256Hex(
  secret: string,
  message: string,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    const key = await subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    return toHex(await subtle.sign('HMAC', key, encoder.encode(message)))
  }
  // WebCrypto is unavailable on insecure (plain http, non-localhost) origins.
  const digest = hmacSha256Sync(encoder.encode(secret), encoder.encode(message))
  return toHex(
    digest.buffer.slice(
      digest.byteOffset,
      digest.byteOffset + digest.byteLength,
    ) as ArrayBuffer,
  )
}

export async function getSignedSmartCdnUrl(
  options: SmartCdnUrlOptions,
): Promise<string> {
  const workspaceSlug = encodeURIComponent(options.workspace)
  const templateSlug = encodeURIComponent(options.template)
  const inputField = encodeURIComponent(options.input)
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(options.urlParams ?? {})) {
    for (const item of Array.isArray(value) ? value : [value])
      query.append(key, String(item))
  }
  const signed = Boolean(options.authKey && options.authSecret)
  if (signed) {
    query.set('auth_key', options.authKey as string)
    query.set('exp', String(options.expiresAt ?? Date.now() + 60 * 60 * 1000))
  }
  query.sort()
  if (signed) {
    const stringToSign = `${workspaceSlug}/${templateSlug}/${inputField}?${query}`
    query.set(
      'sig',
      `sha256:${await hmacSha256Hex(options.authSecret as string, stringToSign)}`,
    )
  }
  const endpoint = (
    options.endpoint ?? `https://${workspaceSlug}.tlcdn.com`
  ).replace(/\/$/, '')
  const qs = query.toString()
  return `${endpoint}/${templateSlug}/${inputField}${qs ? `?${qs}` : ''}`
}
