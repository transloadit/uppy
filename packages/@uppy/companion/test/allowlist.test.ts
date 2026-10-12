import { describe, expect, test, vi } from 'vitest'
import { validateConfig } from '../src/config/companion.js'
import type { CompanionInitOptions } from '../src/schemas/companion.js'
import { hasHostMatch, hasUploadUrlMatch } from '../src/server/helpers/utils.js'
import logger from '../src/server/logger.js'
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
    expect(parseAllowlist('https://a.com/,https://b.com/')).toEqual([
      'https://a.com/',
      'https://b.com/',
    ])
  })

  test('resolves an entry starting with "^" to a RegExp', () => {
    const [entry] = parseAllowlist('^https://\\w+\\.myendpoint\\.com/')
    expect(entry).toBeInstanceOf(RegExp)
    expect(hasUploadUrlMatch('https://a.myendpoint.com/files/', [entry!])).toBe(
      true,
    )
  })

  // Patterns are matched as written, for validHosts as for uploadUrls, so the
  // tail end is still the operator's to anchor.
  test('leaves a validHosts pattern as written', () => {
    const openEnded = parseAllowlist('^(\\w+)\\.myendpoint\\.com')
    expect(hasHostMatch('sub.myendpoint.com', openEnded)).toBe(true)
    expect(hasHostMatch('sub.myendpoint.com.evil.com', openEnded)).toBe(true)

    const anchored = parseAllowlist('^(\\w+)\\.myendpoint\\.com$')
    expect(hasHostMatch('sub.myendpoint.com', anchored)).toBe(true)
    expect(hasHostMatch('sub.myendpoint.com.evil.com', anchored)).toBe(false)
  })

  test('does not split a value that is itself a pattern', () => {
    expect(
      parseAllowlist('^https://a\\w{1,3}\\.myendpoint\\.com/'),
    ).toHaveLength(1)
  })

  test('rejects a pattern that does not compile, keeping the cause', () => {
    expect(() => parseAllowlist('^https://(')).toThrow(
      /Invalid regular expression/,
    )
    expect(() => parseAllowlist('^https://(')).toThrow(
      expect.objectContaining({ cause: expect.any(SyntaxError) }),
    )
  })

  // "^" is resolved here and nowhere else, so a programmatic caller passing an
  // untrusted string cannot turn it into a pattern.
  test('is the only place a leading "^" means anything', () => {
    expect(hasUploadUrlMatch('https://evil.com/', ['^.*'])).toBe(false)
    expect(hasHostMatch('evil.com', ['^.*'])).toBe(false)
  })

  // Entries written as patterns before #6480 are now literal, and stop
  // matching: the destination is refused rather than misdirected.
  test('a pattern that does not start with "^" is a literal that matches nothing', () => {
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

  describe('providerOptions.s3', () => {
    const withS3 = (s3: Record<string, unknown>) =>
      withOptions({ providerOptions: { s3 } } as Partial<CompanionInitOptions>)

    test('accepts a bucket, or a grant key, on its own', () => {
      expect(() =>
        validateConfig(withS3({ bucket: 'b', prefix: 'uploads/' })),
      ).not.toThrow()
      expect(() => validateConfig(withS3({ grantSecret: 's' }))).not.toThrow()
      expect(() =>
        validateConfig(withS3({ grantPublicKey: ['pem'], region: 'r' })),
      ).not.toThrow()
    })

    test('refuses a bucket or prefix next to a grant key', () => {
      expect(() =>
        validateConfig(withS3({ bucket: 'b', grantSecret: 's' })),
      ).toThrow(/cannot be combined with a grant key[\s\S]*at bucket/)
      expect(() =>
        validateConfig(withS3({ prefix: 'p/', grantPublicKey: 'pem' })),
      ).toThrow(/cannot be combined with a grant key[\s\S]*at prefix/)
    })

    test('refuses a provider block with neither', () => {
      expect(() => validateConfig(withS3({ region: 'r' }))).toThrow(
        /set either `bucket`.*or a grant key/,
      )
      expect(() => validateConfig(withS3({ bucket: '' }))).toThrow(
        /providerOptions\.s3/,
      )
      // blank keys do not count as configured
      expect(() => validateConfig(withS3({ grantSecret: [''] }))).toThrow(
        /set either `bucket`/,
      )
    })

    test('still points old upload settings at the top-level s3 block', () => {
      expect(() =>
        validateConfig(withS3({ bucket: 'b', expires: 800 })),
      ).toThrow(/"s3\.expires" instead/)
    })
  })

  test('rejects an uploadUrls entry that is not an absolute URL', () => {
    const parse = () =>
      validateConfig(withOptions({ uploadUrls: ['uploads.myendpoint.com'] }))
    expect(parse).toThrow(/is not an absolute URL/)
    expect(parse).toThrow(expect.objectContaining({ cause: expect.any(Error) }))
  })

  test('warns about a pattern with no "^", in either allowlist', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    try {
      validateConfig(
        withOptions({
          uploadUrls: [/https:\/\/uploads\.myendpoint\.com\//],
          server: {
            host: 'localhost:3020',
            path: '',
            validHosts: [/uploads\.myendpoint\.com/],
          },
        } as Partial<CompanionInitOptions>),
      )
      expect(warn.mock.calls.map(([message]) => message)).toEqual([
        expect.stringContaining('uploadUrls entry'),
        expect.stringContaining('validHosts entry'),
      ])
      expect(warn.mock.calls[0]?.[0]).toContain('not anchored')
    } finally {
      warn.mockRestore()
    }
  })

  test('accepts a RegExp uploadUrls entry', () => {
    expect(() =>
      validateConfig(
        withOptions({ uploadUrls: [/^https:\/\/uploads\.myendpoint\.com\//] }),
      ),
    ).not.toThrow()
  })
})
