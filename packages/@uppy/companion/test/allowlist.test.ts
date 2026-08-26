import { describe, expect, test } from 'vitest'
import { validateConfig } from '../src/config/companion.js'
import type { CompanionInitOptions } from '../src/schemas/companion.js'
import {
  compileUploadUrlPattern,
  hasHostMatch,
  hasUploadUrlMatch,
} from '../src/server/helpers/utils.js'
import { parseAllowlistFromEnv } from '../src/standalone/helper.js'

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

  describe('"re:" pattern entries', () => {
    const pattern = ['re:(\\w+)\\.myendpoint\\.com']

    test.each([
      'sub.myendpoint.com',
      'sub2.myendpoint.com',
    ])('accepts %s', (host) => {
      expect(hasHostMatch(host, pattern)).toBe(true)
    })

    // Anchored, so a pattern cannot match a host that merely contains it.
    test.each([
      'sub.myendpoint.com.evil.com',
      'evil.com/sub.myendpoint.com',
      'sub.myendpoint.comX',
    ])('rejects %s', (host) => {
      expect(hasHostMatch(host, pattern)).toBe(false)
    })

    test('takes a character class literally without the prefix', () => {
      // Sniffing for metacharacters could not see the "[", so this used to be
      // compared literally and silently never matched.
      expect(
        hasHostMatch('dev.myendpoint.com', ['re:[dp]ev\\.myendpoint\\.com']),
      ).toBe(true)
      expect(
        hasHostMatch('[dp]ev.myendpoint.com', ['[dp]ev.myendpoint.com']),
      ).toBe(true)
    })

    test('leaves an IPv6 literal alone', () => {
      expect(hasHostMatch('[::1]', ['[::1]'])).toBe(true)
      expect(hasHostMatch(':', ['[::1]'])).toBe(false)
    })
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

  test('accepts a "re:" pattern entry', () => {
    expect(() =>
      validateConfig(
        withOptions({
          uploadUrls: ['re:https://\\w+\\.myendpoint\\.com/files/'],
        }),
      ),
    ).not.toThrow()
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

  test('rejects an uploadUrls entry that is not an absolute URL', () => {
    expect(() =>
      validateConfig(withOptions({ uploadUrls: ['uploads.myendpoint.com'] })),
    ).toThrow(/is not an absolute URL/)
  })

  test('accepts a validHosts pattern entry', () => {
    expect(() =>
      validateConfig(
        withOptions({
          server: {
            host: 'localhost:3020',
            path: '',
            validHosts: ['re:(\\w+)\\.myendpoint\\.com'],
          },
        } as Partial<CompanionInitOptions>),
      ),
    ).not.toThrow()
  })

  test('accepts RegExp uploadUrls entries', () => {
    expect(() =>
      validateConfig(
        withOptions({ uploadUrls: [/^https:\/\/uploads\.myendpoint\.com\//] }),
      ),
    ).not.toThrow()
  })
})

describe('uploadUrls "re:" pattern entries', () => {
  // Exactly what COMPANION_UPLOAD_URLS produces.
  const fromEnv = (value: string) => parseAllowlistFromEnv(value)

  describe('a correctly written pattern', () => {
    // Anchored, host part cannot cross a boundary, host terminated by "/".
    const allowed = fromEnv(
      're:^https://(?:api2-[a-z0-9]+|api2)\\.myendpoint\\.com/resumable/files/',
    )

    test.each([
      'https://api2-use1.myendpoint.com/resumable/files/',
      // A tus resume url is <endpoint>/<id>.
      'https://api2-use1.myendpoint.com/resumable/files/abc123',
      'https://api2.myendpoint.com/resumable/files/deadbeef',
    ])('accepts %s', (url) => {
      expect(hasUploadUrlMatch(url, allowed)).toBe(true)
    })

    test.each([
      // https://github.com/transloadit/uppy/issues/6480
      'http://169.254.169.254/latest/meta-data/?x=https://api2.myendpoint.com/resumable/files/',
      'http://169.254.169.254/latest/meta-data/',
      'https://api2.myendpoint.com.evil.com/resumable/files/',
      'https://api2.myendpoint.com@evil.com/resumable/files/',
      'http://api2.myendpoint.com/resumable/files/',
      'https://api2-use1.myendpoint.com/admin',
    ])('rejects %s', (url) => {
      expect(hasUploadUrlMatch(url, allowed)).toBe(false)
    })
  })

  test('a "{n,m}" quantifier survives, because a lone pattern is not split', () => {
    const allowed = fromEnv(
      're:^https://api2-[a-z0-9]{1,3}\\.myendpoint\\.com/',
    )
    expect(allowed).toHaveLength(1)
    expect(hasUploadUrlMatch('https://api2-ab.myendpoint.com/x', allowed)).toBe(
      true,
    )
    expect(
      hasUploadUrlMatch('https://api2-abcd.myendpoint.com/x', allowed),
    ).toBe(false)
  })

  test('mixes literal and pattern entries in one list', () => {
    const allowed = fromEnv(
      'https://uploads.myendpoint.com/files/,re:^https://[a-z0-9]+\\.myendpoint\\.com/files/',
    )
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/files/a', allowed),
    ).toBe(true)
    expect(
      hasUploadUrlMatch('https://any.myendpoint.com/files/b', allowed),
    ).toBe(true)
    expect(hasUploadUrlMatch('https://evil.com/files/', allowed)).toBe(false)
  })

  test('rejects a pattern that does not compile', () => {
    expect(() =>
      compileUploadUrlPattern('re:^https://uploads\\.myendpoint\\.com/(files/'),
    ).toThrow(/not a valid regular expression/)
  })

  // A pattern is matched as written, so these mistakes are the operator's to
  // avoid. They are documented in the README; pin them down here so that the
  // documentation cannot quietly stop describing what the matcher does.
  describe('the documented pitfalls really do let a host through', () => {
    test('a pattern with no "^" matches a URL that merely contains it', () => {
      expect(
        hasUploadUrlMatch(
          'http://169.254.169.254/latest/meta-data/?x=https://uploads.myendpoint.com/',
          ['re:https://uploads\\.myendpoint\\.com/'],
        ),
      ).toBe(true)
    })

    test('an unescaped "." in the host part crosses into the path', () => {
      expect(
        hasUploadUrlMatch('https://evil.com/x.myendpoint.com/y', [
          're:^https://.*\\.myendpoint\\.com/',
        ]),
      ).toBe(true)
    })

    test.each([
      'https://a.myendpoint.com.evil.com/',
      'https://a.myendpoint.com@evil.com/',
    ])('an unterminated host part matches %s', (url) => {
      expect(
        hasUploadUrlMatch(url, ['re:^https://[a-z0-9]+\\.myendpoint\\.com']),
      ).toBe(true)
    })
  })
})

describe('an entry that used to be compiled as a regex', () => {
  // Before #6480 was fixed, every string was compiled with `new RegExp`.
  // Such an entry is now taken literally, so it stops matching -- uploads fail
  // rather than going somewhere unintended. Migrating it means adding "re:".
  const old = 'https://api2-(\\w+)\\.myendpoint\\.com/resumable/files/?'

  test('no longer matches, so the misconfiguration is immediately visible', () => {
    expect(
      hasUploadUrlMatch('https://api2-use1.myendpoint.com/resumable/files/x', [
        old,
      ]),
    ).toBe(false)
  })

  test('works again once prefixed and anchored', () => {
    const migrated = [`re:^${old}`]
    expect(
      hasUploadUrlMatch(
        'https://api2-use1.myendpoint.com/resumable/files/x',
        migrated,
      ),
    ).toBe(true)
    expect(
      hasUploadUrlMatch(
        'http://169.254.169.254/?x=https://api2.myendpoint.com/resumable/files/',
        migrated,
      ),
    ).toBe(false)
  })
})

describe('a validHosts entry that used to be sniffed as a pattern', () => {
  // Whether an entry was a pattern used to be inferred from its characters.
  // It is now explicit, so an entry written as a bare pattern is a literal
  // hostname: the OAuth redirect is refused rather than sent somewhere else.
  test('no longer matches, so the misconfiguration is immediately visible', () => {
    expect(hasHostMatch('sub.myendpoint.com', ['(\\w+).myendpoint.com'])).toBe(
      false,
    )
  })

  test('works again once prefixed', () => {
    expect(
      hasHostMatch('sub.myendpoint.com', ['re:(\\w+)\\.myendpoint\\.com']),
    ).toBe(true)
  })

  test('a plain hostname is unaffected', () => {
    expect(
      hasHostMatch('uploads.myendpoint.com', ['uploads.myendpoint.com']),
    ).toBe(true)
  })
})
