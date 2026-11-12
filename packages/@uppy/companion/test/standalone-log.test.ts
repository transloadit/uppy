import { describe, expect, test } from 'vitest'
import { accessLogUrl } from '../dist/standalone/index.js'

// The morgan url token used to read req.query and req.path, which in
// Express 5 are getters that re-parse req.url. On an aborted request whose
// path was rewritten by the router (`//x@[a#`), that re-parse threw
// ERR_INVALID_URL from a socket error handler and exited the process.
describe('accessLogUrl', () => {
  test('returns a malformed path untouched', () => {
    expect(accessLogUrl({ originalUrl: '/connect/dropbox//x@[a#' })).toBe(
      '/connect/dropbox//x@[a#',
    )
    expect(accessLogUrl({ originalUrl: '//x@[a#?a=1' })).toBe('//x@[a#?a=1')
  })

  test('censors sensitive query values', () => {
    expect(accessLogUrl({ originalUrl: '/x?uppyAuthToken=secret&b=1' })).toBe(
      '/x?uppyAuthToken=********&b=1',
    )
    expect(accessLogUrl({ originalUrl: '/x?access_token=s' })).toBe(
      '/x?access_token=********',
    )
    // a repeated key parses to an array
    expect(
      accessLogUrl({ originalUrl: '/x?uppyAuthToken=a&uppyAuthToken=b' }),
    ).toBe('/x?uppyAuthToken=********')
  })

  test('censors the OAuth code and the auth-callback token', () => {
    expect(
      accessLogUrl({ originalUrl: '/dropbox/redirect?code=abc&state=s' }),
    ).toBe('/dropbox/redirect?code=********&state=s')
    expect(
      accessLogUrl({ originalUrl: '/dropbox/connect?authCallbackToken=t' }),
    ).toBe('/dropbox/connect?authCallbackToken=********')
  })

  test('leaves other query strings as they were sent', () => {
    expect(accessLogUrl({ originalUrl: '/x?b=1&c=%20' })).toBe('/x?b=1&c=%20')
  })

  test('falls back to url, then to a dash', () => {
    expect(accessLogUrl({ url: '/u' })).toBe('/u')
    expect(accessLogUrl({})).toBe('-')
  })
})
