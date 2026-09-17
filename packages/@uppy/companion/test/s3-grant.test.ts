import { generateKeyPairSync } from 'node:crypto'
import jwt, { type Algorithm } from 'jsonwebtoken'
import { describe, expect, test } from 'vitest'
import {
  GrantExpiredError,
  type GrantKeys,
  hasGrantKeys,
  InvalidGrantError,
  normalizeStorageGrantPrefix,
  verifyStorageGrant,
} from '../dist/server/provider/s3/grant.js'

const SECRET = 'grant-secret-one'
const OTHER_SECRET = 'grant-secret-two'

const { privateKey: ecPrivateKey, publicKey: ecPublicKey } =
  generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

const { privateKey: rsaPrivateKey, publicKey: rsaPublicKey } =
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

const nowSeconds = () => Math.floor(Date.now() / 1000)

type Claims = {
  v?: unknown
  bucket?: unknown
  prefix?: unknown
  scopes?: unknown
  exp?: unknown
  sub?: unknown
}

const claims = (overrides: Claims = {}): Record<string, unknown> => ({
  v: 1,
  bucket: 'my-bucket',
  prefix: 'tenant-1/',
  scopes: ['read'],
  exp: nowSeconds() + 900,
  ...overrides,
})

const mint = (
  payload: Record<string, unknown>,
  key: string,
  algorithm: Algorithm = 'HS256',
): string => jwt.sign(payload, key, { algorithm })

/**
 * Signs a raw JSON string, which skips jsonwebtoken's own validation of the
 * registered claims, so malformed grants can be minted at all.
 */
const mintRaw = (payload: Record<string, unknown>, key: string): string =>
  jwt.sign(JSON.stringify(payload), key, { algorithm: 'HS256' })

const base64url = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url')

describe('verifyStorageGrant', () => {
  test('verifies an HS256 grant', () => {
    const token = mint(
      claims({ prefix: '/tenant-1', scopes: ['read', 'write'], sub: 'user-9' }),
      SECRET,
    )

    expect(verifyStorageGrant(token, { secrets: SECRET })).toEqual({
      bucket: 'my-bucket',
      prefix: 'tenant-1/',
      write: true,
      exp: expect.any(Number),
      sub: 'user-9',
    })
  })

  test('omits sub when the grant carries none', () => {
    const grant = verifyStorageGrant(mint(claims(), SECRET), {
      secrets: [SECRET],
    })

    expect(grant.write).toBe(false)
    expect('sub' in grant).toBe(false)
  })

  test('verifies an ES256 grant against a PEM public key', () => {
    const token = mint(claims(), ecPrivateKey, 'ES256')

    expect(verifyStorageGrant(token, { publicKeys: ecPublicKey }).bucket).toBe(
      'my-bucket',
    )
  })

  test('verifies an RS256 grant against a PEM public key', () => {
    const token = mint(claims(), rsaPrivateKey, 'RS256')

    expect(
      verifyStorageGrant(token, { publicKeys: [rsaPublicKey] }).bucket,
    ).toBe('my-bucket')
  })

  test('accepts a grant signed with any of the rotated secrets', () => {
    const token = mint(claims(), OTHER_SECRET)

    expect(
      verifyStorageGrant(token, { secrets: [SECRET, OTHER_SECRET] }).bucket,
    ).toBe('my-bucket')
  })

  test('tries secrets and public keys together', () => {
    const hs = mint(claims(), SECRET)
    const es = mint(claims(), ecPrivateKey, 'ES256')
    const keys: GrantKeys = { secrets: [SECRET], publicKeys: [ecPublicKey] }

    expect(verifyStorageGrant(hs, keys).bucket).toBe('my-bucket')
    expect(verifyStorageGrant(es, keys).bucket).toBe('my-bucket')
  })

  test('rejects a tampered payload', () => {
    const [header, , signature] = mint(claims(), SECRET).split('.')
    const forged = `${header}.${base64url(
      JSON.stringify(claims({ bucket: 'someone-elses-bucket' })),
    )}.${signature}`

    expect(() => verifyStorageGrant(forged, { secrets: SECRET })).toThrow(
      InvalidGrantError,
    )
  })

  test('rejects a grant signed with an unknown secret', () => {
    const token = mint(claims(), 'not-configured')

    expect(() =>
      verifyStorageGrant(token, { secrets: [SECRET, OTHER_SECRET] }),
    ).toThrow(InvalidGrantError)
  })

  test('rejects an alg: none token', () => {
    const token = `${base64url(
      JSON.stringify({ alg: 'none', typ: 'JWT' }),
    )}.${base64url(JSON.stringify(claims()))}.`

    expect(() => verifyStorageGrant(token, { secrets: SECRET })).toThrow(
      InvalidGrantError,
    )
    expect(() =>
      verifyStorageGrant(token, { publicKeys: ecPublicKey }),
    ).toThrow(InvalidGrantError)
  })

  test('does not accept a public key PEM used as an HMAC secret', () => {
    // The whole point of confining public keys to asymmetric algorithms: a
    // published PEM must not double as a shared secret.
    const token = mint(claims(), ecPublicKey, 'HS256')

    expect(() =>
      verifyStorageGrant(token, { publicKeys: ecPublicKey }),
    ).toThrow(InvalidGrantError)
    expect(() =>
      verifyStorageGrant(token, { publicKeys: [rsaPublicKey, ecPublicKey] }),
    ).toThrow(InvalidGrantError)
  })

  test('rejects a grant whose scopes lack read', () => {
    const token = mint(claims({ scopes: ['write'] }), SECRET)

    expect(() => verifyStorageGrant(token, { secrets: SECRET })).toThrow(
      InvalidGrantError,
    )
  })

  test('rejects unknown scopes, a wrong version and an empty bucket', () => {
    const cases = [
      claims({ scopes: ['read', 'admin'] }),
      claims({ v: 2 }),
      claims({ bucket: '' }),
      claims({ prefix: 42 }),
      claims({ exp: '123' }),
    ]

    for (const payload of cases) {
      expect(() =>
        verifyStorageGrant(mintRaw(payload, SECRET), { secrets: SECRET }),
      ).toThrow(InvalidGrantError)
    }
  })

  test('throws GrantExpiredError once the grant expires', () => {
    const exp = nowSeconds() + 60
    const token = mint(claims({ exp }), SECRET)

    expect(
      verifyStorageGrant(token, { secrets: SECRET }, new Date((exp - 1) * 1000))
        .exp,
    ).toBe(exp)
    // `exp` is inclusive: at exactly `exp` the grant is already gone.
    expect(() =>
      verifyStorageGrant(token, { secrets: SECRET }, new Date(exp * 1000)),
    ).toThrow(GrantExpiredError)
    expect(() =>
      verifyStorageGrant(
        token,
        { secrets: SECRET },
        new Date((exp + 60) * 1000),
      ),
    ).toThrow(GrantExpiredError)
  })

  test('an expired grant signed with an unknown secret is invalid, not expired', () => {
    const token = mint(claims({ exp: nowSeconds() - 60 }), 'not-configured')

    expect(() => verifyStorageGrant(token, { secrets: SECRET })).toThrow(
      InvalidGrantError,
    )
    expect(() => verifyStorageGrant(token, { secrets: SECRET })).not.toThrow(
      GrantExpiredError,
    )
  })

  test('reports expiry even when another configured key fails to verify', () => {
    const token = mint(claims({ exp: nowSeconds() - 60 }), OTHER_SECRET)

    expect(() =>
      verifyStorageGrant(token, { secrets: [SECRET, OTHER_SECRET] }),
    ).toThrow(GrantExpiredError)
  })

  test('rejects garbage and throws when no key is configured', () => {
    expect(() => verifyStorageGrant('not-a-jwt', { secrets: SECRET })).toThrow(
      InvalidGrantError,
    )
    expect(() => verifyStorageGrant(mint(claims(), SECRET), {})).toThrow(
      InvalidGrantError,
    )
    expect(() =>
      verifyStorageGrant(mint(claims(), SECRET), {
        secrets: [],
        publicKeys: undefined,
      }),
    ).toThrow(InvalidGrantError)
  })
})

describe('normalizeStorageGrantPrefix', () => {
  test('applies Companion prefix policy', () => {
    expect(normalizeStorageGrantPrefix('/tenant')).toBe('tenant/')
    expect(normalizeStorageGrantPrefix('///tenant')).toBe('tenant/')
    expect(normalizeStorageGrantPrefix('')).toBe('')
    expect(normalizeStorageGrantPrefix('/')).toBe('')
    expect(normalizeStorageGrantPrefix('a/b/')).toBe('a/b/')
    expect(normalizeStorageGrantPrefix('a/b')).toBe('a/b/')
  })
})

describe('hasGrantKeys', () => {
  test('is true only when a non-empty key is configured', () => {
    expect(hasGrantKeys({})).toBe(false)
    expect(hasGrantKeys({ secrets: undefined, publicKeys: undefined })).toBe(
      false,
    )
    expect(hasGrantKeys({ secrets: [] })).toBe(false)
    expect(hasGrantKeys({ secrets: '' })).toBe(false)
    expect(hasGrantKeys({ secrets: [''] })).toBe(false)
    expect(hasGrantKeys({ publicKeys: '' })).toBe(false)
    expect(hasGrantKeys({ secrets: SECRET })).toBe(true)
    expect(hasGrantKeys({ secrets: ['', SECRET] })).toBe(true)
    expect(hasGrantKeys({ publicKeys: ecPublicKey })).toBe(true)
  })
})
