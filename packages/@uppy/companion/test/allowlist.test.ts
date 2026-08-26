import { describe, expect, test } from 'vitest'
import { validateConfig } from '../src/config/companion.js'
import type { CompanionInitOptions } from '../src/schemas/companion.js'
import { hasHostMatch, hasUploadUrlMatch } from '../src/server/helpers/utils.js'
import { parseAllowlist } from '../src/standalone/helper.js'

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
  ])('rejects %s', (url) => {
    expect(hasUploadUrlMatch(url, allowed)).toBe(false)
  })

  test.each([
    'https://uploads.myendpoint.com/files/',
    // A resumable upload url is <endpoint>/<id>.
    'https://uploads.myendpoint.com/files/nested/file.txt',
    'https://UPLOADS.MyEndpoint.com/files/',
  ])('accepts %s', (url) => {
    expect(hasUploadUrlMatch(url, allowed)).toBe(true)
  })

  test('tests a RegExp entry as written', () => {
    const entry = [/^https:\/\/uploads\.myendpoint\.com\//]
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/files/', entry),
    ).toBe(true)
    expect(hasUploadUrlMatch('https://evil.com/', entry)).toBe(false)
  })
})

describe('hasHostMatch', () => {
  test.each([
    'uploads.myendpoint.com.evil.com',
    'uploadsXmyendpoint.com',
    'uploads.myendpoint.com:3020',
  ])('rejects %s', (host) => {
    expect(hasHostMatch(host, ['uploads.myendpoint.com'])).toBe(false)
  })

  test('accepts the host, case-insensitively', () => {
    expect(
      hasHostMatch('UPLOADS.MyEndpoint.com', ['uploads.myendpoint.com']),
    ).toBe(true)
  })

  test('tests a RegExp entry as written', () => {
    expect(
      hasHostMatch('a.myendpoint.com', [/^[a-z]+\.myendpoint\.com$/]),
    ).toBe(true)
  })
})

describe('parseAllowlist', () => {
  test('splits a list, leaving entries literal', () => {
    expect(
      parseAllowlist('https://a.com/,https://b.com/', { anchor: false }),
    ).toEqual(['https://a.com/', 'https://b.com/'])
  })

  test('resolves "re:" to a RegExp, so the matcher never sees the prefix', () => {
    const [entry] = parseAllowlist('re:^https://\\w+\\.myendpoint\\.com/', {
      anchor: false,
    })
    expect(entry).toBeInstanceOf(RegExp)
    expect(hasUploadUrlMatch('https://a.myendpoint.com/files/', [entry!])).toBe(
      true,
    )
  })

  test('anchors a validHosts pattern, so it cannot match a longer host', () => {
    const hosts = parseAllowlist('re:(\\w+)\\.myendpoint\\.com', {
      anchor: true,
    })
    expect(hasHostMatch('sub.myendpoint.com', hosts)).toBe(true)
    expect(hasHostMatch('sub.myendpoint.com.evil.com', hosts)).toBe(false)
  })

  test('does not split a value that is itself a pattern', () => {
    expect(
      parseAllowlist('re:^https://a\\w{1,3}\\.myendpoint\\.com/', {
        anchor: false,
      }),
    ).toHaveLength(1)
  })

  test('rejects a pattern that does not compile', () => {
    expect(() => parseAllowlist('re:^https://(', { anchor: false })).toThrow(
      /Invalid regular expression/,
    )
  })

  // "re:" is resolved here and nowhere else, so a programmatic caller passing
  // an untrusted string cannot turn it into a pattern.
  test('is the only place "re:" means anything', () => {
    expect(hasUploadUrlMatch('https://evil.com/', ['re:.*'])).toBe(false)
    expect(hasHostMatch('evil.com', ['re:.*'])).toBe(false)
  })

  // Entries written as patterns before #6480 are now literal, and stop
  // matching: the destination is refused rather than misdirected.
  test('an unprefixed pattern is a literal that matches nothing', () => {
    expect(hasHostMatch('sub.myendpoint.com', ['(\\w+).myendpoint.com'])).toBe(
      false,
    )
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

  test('accepts a literal uploadUrls entry', () => {
    expect(() => validateConfig(baseOptions)).not.toThrow()
  })

  test('rejects an uploadUrls entry that is not an absolute URL', () => {
    expect(() =>
      validateConfig(withOptions({ uploadUrls: ['uploads.myendpoint.com'] })),
    ).toThrow(/is not an absolute URL/)
  })

  test('accepts a RegExp uploadUrls entry', () => {
    expect(() =>
      validateConfig(
        withOptions({ uploadUrls: [/^https:\/\/uploads\.myendpoint\.com\//] }),
      ),
    ).not.toThrow()
  })
})
