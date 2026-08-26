import { describe, expect, test } from 'vitest'
import { validateConfig } from '../src/config/companion.js'
import type { CompanionInitOptions } from '../src/schemas/companion.js'
import {
  compileUploadUrlPattern,
  hasHostMatch,
  hasUploadUrlMatch,
} from '../src/server/helpers/utils.js'
import { parseUploadUrlsFromEnv } from '../src/standalone/helper.js'

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

  // The docs document patterns here, e.g. `(\w+).example.com`. They keep
  // working, but are anchored so they cannot match a host that merely
  // contains them.
  describe('pattern entries', () => {
    const pattern = ['(\\w+).myendpoint.com']

    test.each([
      'sub.myendpoint.com',
      'sub2.myendpoint.com',
    ])('accepts %s', (host) => {
      expect(hasHostMatch(host, pattern)).toBe(true)
    })

    test.each([
      'sub.myendpoint.com.evil.com',
      'evil.com/sub.myendpoint.com',
      'sub.myendpoint.comX',
    ])('rejects %s', (host) => {
      expect(hasHostMatch(host, pattern)).toBe(false)
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

  test('rejects an uploadUrls entry written as a regular expression', () => {
    expect(() =>
      validateConfig(
        withOptions({ uploadUrls: ['https://.*\\.myendpoint\\.com/'] }),
      ),
    ).toThrow(/looks like a regular expression/)
  })

  test('points an unprefixed pattern at the "re:" prefix', () => {
    expect(() =>
      validateConfig(
        withOptions({ uploadUrls: ['https://.*\\.myendpoint\\.com/'] }),
      ),
    ).toThrow(/prefix the entry with "re:"/)
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

  test('rejects a malformed "re:" entry at startup', () => {
    expect(() =>
      validateConfig(
        withOptions({
          uploadUrls: ['re:https://uploads\\.myendpoint\\.com/(files/'],
        }),
      ),
    ).toThrow()
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

  test('accepts a validHosts pattern entry', () => {
    expect(() =>
      validateConfig(
        withOptions({
          server: {
            host: 'localhost:3020',
            path: '',
            validHosts: ['(\\w+).myendpoint.com'],
          },
        } as Partial<CompanionInitOptions>),
      ),
    ).not.toThrow()
  })

  test('rejects a validHosts entry that is not a valid regular expression', () => {
    expect(() =>
      validateConfig(
        withOptions({
          server: {
            host: 'localhost:3020',
            path: '',
            validHosts: ['(unclosed.myendpoint.com'],
          },
        } as Partial<CompanionInitOptions>),
      ),
    ).toThrow(/is not a valid regular expression/)
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
  // Exactly what COMPANION_UPLOAD_URLS produces: split(',') over the env value.
  const fromEnv = (value: string) => value.split(',')

  describe('a standalone config using patterns', () => {
    const allowed = fromEnv(
      're:https://api2-(\\w+)\\.myendpoint\\.com/resumable/files/?,re:https://api2\\.myendpoint\\.com/resumable/files/?',
    )

    test.each([
      'https://api2-use1.myendpoint.com/resumable/files/',
      'https://api2-use1.myendpoint.com/resumable/files',
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
      // The host pattern is anchored, so it cannot run on into a suffix.
      'https://api2.myendpoint.com.evil.com/resumable/files/',
      // Userinfo must not be able to disguise the real host.
      'https://api2.myendpoint.com@evil.com/resumable/files/',
      'http://api2.myendpoint.com/resumable/files/',
      'https://api2-use1.myendpoint.com/admin',
      'https://evil.com/?y=https://api2.myendpoint.com/resumable/files/',
    ])('rejects %s', (url) => {
      expect(hasUploadUrlMatch(url, allowed)).toBe(false)
    })
  })

  test('matches a pattern path only at a path boundary', () => {
    const entry = ['re:https://uploads\\.myendpoint\\.com/files']
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/files/a', entry),
    ).toBe(true)
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/filesomething', entry),
    ).toBe(false)
  })

  test('matches a port explicitly or not at all', () => {
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com:8443/', [
        're:https://uploads\\.myendpoint\\.com/',
      ]),
    ).toBe(false)
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com:8443/', [
        're:https://uploads\\.myendpoint\\.com:8443/',
      ]),
    ).toBe(true)
  })

  test('mixes literal and pattern entries in one allowlist', () => {
    const allowed = fromEnv(
      'https://uploads.myendpoint.com/files/,re:https://\\w+\\.myotherendpoint\\.com/files/',
    )
    expect(
      hasUploadUrlMatch('https://uploads.myendpoint.com/files/a', allowed),
    ).toBe(true)
    expect(
      hasUploadUrlMatch('https://a.myotherendpoint.com/files/b', allowed),
    ).toBe(true)
    expect(hasUploadUrlMatch('https://evil.com/files/', allowed)).toBe(false)
  })

  test('supports alternation, so a comma is never needed inside an entry', () => {
    const entry = ['re:https://(?:api2-\\w+|api2)\\.myendpoint\\.com/files/']
    expect(
      hasUploadUrlMatch('https://api2-use1.myendpoint.com/files/x', entry),
    ).toBe(true)
    expect(
      hasUploadUrlMatch('https://api2.myendpoint.com/files/x', entry),
    ).toBe(true)
    expect(
      hasUploadUrlMatch('https://api3.myendpoint.com/files/x', entry),
    ).toBe(false)
  })

  test('rejects a pattern torn in half by the comma separator', () => {
    // What `a{1,2}` becomes after split(',').
    expect(() =>
      compileUploadUrlPattern('re:https://a{1\\.myendpoint\\.com/'),
    ).toThrow(/unbalanced "\{"/)
  })

  test('rejects a pattern entry that is not scheme://host', () => {
    expect(() =>
      compileUploadUrlPattern('re:uploads\\.myendpoint\\.com/files/'),
    ).toThrow(/must look like/)
  })

  test('rejects a pattern entry that does not compile', () => {
    expect(() =>
      compileUploadUrlPattern('re:https://uploads\\.myendpoint\\.com/(files/'),
    ).toThrow()
  })
})

describe('parseUploadUrlsFromEnv', () => {
  test('splits a plain list on commas', () => {
    expect(
      parseUploadUrlsFromEnv(
        'https://uploads.myendpoint.com/files/,https://other.myendpoint.com/files/',
      ),
    ).toEqual([
      'https://uploads.myendpoint.com/files/',
      'https://other.myendpoint.com/files/',
    ])
  })

  test('does not split a value that is itself a pattern', () => {
    // A `{n,m}` quantifier is only expressible because nothing splits here.
    const value =
      're:https://api2-\\w{1,3}\\.myendpoint\\.com/resumable/files/?'
    expect(parseUploadUrlsFromEnv(value)).toEqual([value])
    expect(
      hasUploadUrlMatch(
        'https://api2-ab.myendpoint.com/resumable/files/x',
        parseUploadUrlsFromEnv(value),
      ),
    ).toBe(true)
    expect(
      hasUploadUrlMatch(
        'https://api2-abcd.myendpoint.com/resumable/files/x',
        parseUploadUrlsFromEnv(value),
      ),
    ).toBe(false)
  })

  test('rejects a leading pattern followed by further pattern entries', () => {
    expect(() =>
      parseUploadUrlsFromEnv(
        're:https://a\\.myendpoint\\.com/,re:https://b\\.myendpoint\\.com/',
      ),
    ).toThrow(/Combine the alternatives into one pattern/)
  })

  test('still allows a pattern among literals when it does not lead', () => {
    const entries = parseUploadUrlsFromEnv(
      'https://uploads.myendpoint.com/files/,re:https://\\w+\\.myendpoint\\.com/files/',
    )
    expect(entries).toHaveLength(2)
    expect(
      hasUploadUrlMatch('https://any.myendpoint.com/files/x', entries),
    ).toBe(true)
  })
})

describe('a pattern is safe however the operator spells it', () => {
  // Written correctly, then with the two mistakes that make the equivalent
  // whole-string regex exploitable: the terminating "/" left off, and ".*"
  // used where a character class was meant.
  const spellings = [
    're:https://[a-z0-9]*\\.myendpoint\\.com/',
    're:https://[a-z0-9]*\\.myendpoint\\.com',
    're:https://.*\\.myendpoint\\.com/',
  ]

  test.each(spellings)('%s accepts the intended host', (entry) => {
    expect(hasUploadUrlMatch('https://a.myendpoint.com/ok', [entry])).toBe(true)
  })

  test.each(spellings)('%s rejects every bypass', (entry) => {
    for (const url of [
      'https://evil.com/x.myendpoint.com/y',
      'https://a.myendpoint.com.evil.com/',
      'https://a.myendpoint.com@evil.com/',
      'https://evil.com/?x=https://a.myendpoint.com/',
    ]) {
      expect(hasUploadUrlMatch(url, [entry])).toBe(false)
    }
  })
})
