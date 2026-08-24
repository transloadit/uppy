import { describe, expect, test } from 'vitest'
import { validateConfig } from '../src/config/companion.js'
import type { CompanionInitOptions } from '../src/schemas/companion.js'
import { hasHostMatch, hasUploadUrlMatch } from '../src/server/helpers/utils.js'

describe('hasUploadUrlMatch', () => {
  const allowed = ['https://uploads.myendpoint.com/files/']

  // https://github.com/transloadit/uppy/issues/6480
  test.each([
    'http://internal-admin:9090/admin?next=https://uploads.myendpoint.com/files/',
    'http://169.254.169.254/latest/meta-data/#https://uploads.myendpoint.com/files/',
    'https://evil.com/https://uploads.myendpoint.com/files/',
    'https://uploads.myendpoint.com.evil.com/files/',
    'https://uploads.myendpoint.com/filesomething',
    'http://uploads.myendpoint.com/files/',
    'https://uploads.myendpoint.com:8443/files/',
  ])('rejects %s', (url) => {
    expect(hasUploadUrlMatch(url, allowed)).toBe(false)
  })

  test.each([
    'https://uploads.myendpoint.com/files/',
    'https://uploads.myendpoint.com/files/nested/file.txt',
    'https://uploads.myendpoint.com/files/?query=1#hash',
    'https://UPLOADS.MyEndpoint.com/files/',
    'https://uploads.myendpoint.com:443/files/',
  ])('accepts %s', (url) => {
    expect(hasUploadUrlMatch(url, allowed)).toBe(true)
  })

  test('an entry without a path allows its whole origin, and nothing else', () => {
    const originOnly = ['https://uploads.myendpoint.com']
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/anything', originOnly),
    ).toBe(true)
    expect(hasUploadUrlMatch('https://other.com/anything', originOnly)).toBe(
      false,
    )
  })

  test('matches an entry path only at a path boundary', () => {
    const entry = ['https://uploads.myendpoint.com/files']
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/files', entry),
    ).toBe(true)
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/files/a', entry),
    ).toBe(true)
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/filesomething', entry),
    ).toBe(false)
  })

  test('still supports RegExp entries as written', () => {
    const entry = [/^https:\/\/uploads\.myendpoint\.com\//]
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/files/', entry),
    ).toBe(true)
    expect(hasUploadUrlMatch('https://evil.com/', entry)).toBe(false)
  })
})

describe('hasHostMatch', () => {
  const allowed = ['uploads.myendpoint.com']

  test.each([
    'uploads.myendpoint.com.evil.com',
    'evil.com/uploads.myendpoint.com',
    'uploadsXmyendpoint.com',
    'uploads.myendpoint.com:3020',
  ])('rejects %s', (host) => {
    expect(hasHostMatch(host, allowed)).toBe(false)
  })

  test.each([
    'uploads.myendpoint.com',
    'UPLOADS.MyEndpoint.com',
  ])('accepts %s', (host) => {
    expect(hasHostMatch(host, allowed)).toBe(true)
  })

  test('still supports RegExp entries as written', () => {
    expect(
      hasHostMatch('a.myendpoint.com', [/^[a-z]+\.myendpoint\.com$/]),
    ).toBe(true)
  })
})

describe('validateConfig', () => {
  const baseOptions = {
    filePath: './test/output',
    secret: 'secret',
    corsOrigins: true,
    server: { host: 'localhost:3020', path: '' },
    uploadUrls: ['https://uploads.myendpoint.com/files/'],
  } as unknown as CompanionInitOptions

  const withOptions = (overrides: Partial<CompanionInitOptions>) =>
    ({ ...baseOptions, ...overrides }) as CompanionInitOptions

  test('accepts literal uploadUrls', () => {
    expect(() => validateConfig(baseOptions)).not.toThrow()
  })

  test('rejects an uploadUrls entry written as a regular expression', () => {
    expect(() =>
      validateConfig(
        withOptions({ uploadUrls: ['https://.*\\.myendpoint\\.com/'] }),
      ),
    ).toThrow(/looks like a regular expression/)
  })

  test('accepts a literal path containing URL-legal regex characters', () => {
    expect(() =>
      validateConfig(
        withOptions({
          uploadUrls: ['https://uploads.myendpoint.com/files$(1)/'],
        }),
      ),
    ).not.toThrow()
  })

  test.each([
    'https://uploads.*.myendpoint.com/',
    'https://.*.myendpoint.com/',
  ])('rejects an uploadUrls entry with a wildcard host: %s', (entry) => {
    expect(() => validateConfig(withOptions({ uploadUrls: [entry] }))).toThrow(
      /looks like a regular expression/,
    )
  })

  test('rejects an uploadUrls entry that is not an absolute URL', () => {
    expect(() =>
      validateConfig(withOptions({ uploadUrls: ['uploads.myendpoint.com'] })),
    ).toThrow(/is not an absolute URL/)
  })

  test('rejects a validHosts entry written as a regular expression', () => {
    expect(() =>
      validateConfig(
        withOptions({
          server: {
            host: 'localhost:3020',
            path: '',
            validHosts: ['.*\\.myendpoint\\.com'],
          },
        } as Partial<CompanionInitOptions>),
      ),
    ).toThrow(/looks like a regular expression/)
  })

  test('accepts RegExp uploadUrls entries', () => {
    expect(() =>
      validateConfig(
        withOptions({ uploadUrls: [/^https:\/\/uploads\.myendpoint\.com\//] }),
      ),
    ).not.toThrow()
  })
})
