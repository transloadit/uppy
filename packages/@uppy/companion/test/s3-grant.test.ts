import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { describe, expect, test } from 'vitest'
import {
  GrantExpiredError,
  type GrantKeys,
  hasGrantKeys,
  InvalidGrantError,
  normalizeStorageGrantPrefix,
  verifyStorageGrant,
} from '../src/server/provider/s3/grant.js'
import {
  claims,
  type GrantClaims,
  mint,
  nowSeconds,
  GRANT_SECRET as SECRET,
} from './fixtures/s3.js'

const OTHER_SECRET = 'grant-secret-two'

const generateEcKeyPair = () =>
  generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

const { privateKey: ecPrivateKey, publicKey: ecPublicKey } = generateEcKeyPair()
const { publicKey: otherEcPublicKey } = generateEcKeyPair()

/**
 * Signs a raw JSON string, which skips jsonwebtoken's own validation of the
 * registered claims, so malformed grants can be minted at all.
 */
const mintRaw = (payload: GrantClaims, key: string): string =>
  jwt.sign(JSON.stringify(payload), key, { algorithm: 'HS256' })

const base64url = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url')

describe('verifyStorageGrant', () => {
  test('verifies an HS256 grant, keeping only what the provider acts on', () => {
    const token = mint(
      claims({ prefix: '/tenant-1', scopes: ['read', 'write'], sub: 'user-9' }),
      SECRET,
    )

    expect(verifyStorageGrant(token, { grantSecret: SECRET })).toEqual({
      bucket: 'my-bucket',
      prefix: 'tenant-1/',
      write: true,
      exp: expect.any(Number),
    })
    expect(
      verifyStorageGrant(mint(claims(), SECRET), { grantSecret: [SECRET] })
        .write,
    ).toBe(false)
  })

  test('verifies an ES256 grant against a PEM public key', () => {
    const token = mint(claims(), ecPrivateKey, 'ES256')

    expect(
      verifyStorageGrant(token, { grantPublicKey: ecPublicKey }).bucket,
    ).toBe('my-bucket')
  })

  test('verifies an RS256 grant against a PEM public key', () => {
    // Generated here rather than at module load: RSA is slow, and this is the
    // only test that needs a pair.
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })
    const token = mint(claims(), privateKey, 'RS256')

    expect(
      verifyStorageGrant(token, { grantPublicKey: [publicKey] }).bucket,
    ).toBe('my-bucket')
  })

  test('accepts a grant signed with any of the rotated secrets', () => {
    const token = mint(claims(), OTHER_SECRET)

    expect(
      verifyStorageGrant(token, { grantSecret: [SECRET, OTHER_SECRET] }).bucket,
    ).toBe('my-bucket')
  })

  test('tries secrets and public keys together', () => {
    const hs = mint(claims(), SECRET)
    const es = mint(claims(), ecPrivateKey, 'ES256')
    const keys: GrantKeys = {
      grantSecret: [SECRET],
      grantPublicKey: [ecPublicKey],
    }

    expect(verifyStorageGrant(hs, keys).bucket).toBe('my-bucket')
    expect(verifyStorageGrant(es, keys).bucket).toBe('my-bucket')
  })

  test('rejects a tampered payload', () => {
    const [header, , signature] = mint(claims(), SECRET).split('.')
    const forged = `${header}.${base64url(
      JSON.stringify(claims({ bucket: 'someone-elses-bucket' })),
    )}.${signature}`

    expect(() => verifyStorageGrant(forged, { grantSecret: SECRET })).toThrow(
      InvalidGrantError,
    )
  })

  test('rejects a grant signed with an unknown secret', () => {
    const token = mint(claims(), 'not-configured')

    expect(() =>
      verifyStorageGrant(token, { grantSecret: [SECRET, OTHER_SECRET] }),
    ).toThrow(InvalidGrantError)
  })

  test('rejects an alg: none token', () => {
    const token = `${base64url(
      JSON.stringify({ alg: 'none', typ: 'JWT' }),
    )}.${base64url(JSON.stringify(claims()))}.`

    expect(() => verifyStorageGrant(token, { grantSecret: SECRET })).toThrow(
      InvalidGrantError,
    )
    expect(() =>
      verifyStorageGrant(token, { grantPublicKey: ecPublicKey }),
    ).toThrow(InvalidGrantError)
  })

  test('does not accept a public key PEM used as an HMAC secret', () => {
    // The whole point of confining public keys to asymmetric algorithms: a
    // published PEM must not double as a shared secret.
    const token = mint(claims(), ecPublicKey, 'HS256')

    expect(() =>
      verifyStorageGrant(token, { grantPublicKey: ecPublicKey }),
    ).toThrow(InvalidGrantError)
    expect(() =>
      verifyStorageGrant(token, {
        grantPublicKey: [otherEcPublicKey, ecPublicKey],
      }),
    ).toThrow(InvalidGrantError)
  })

  test('rejects a grant whose scopes lack read', () => {
    const token = mint(claims({ scopes: ['write'] }), SECRET)

    expect(() => verifyStorageGrant(token, { grantSecret: SECRET })).toThrow(
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
        verifyStorageGrant(mintRaw(payload, SECRET), { grantSecret: SECRET }),
      ).toThrow(InvalidGrantError)
    }
  })

  test('throws GrantExpiredError once the grant expires', () => {
    const exp = nowSeconds() + 60
    const token = mint(claims({ exp }), SECRET)

    expect(
      verifyStorageGrant(
        token,
        { grantSecret: SECRET },
        new Date((exp - 1) * 1000),
      ).exp,
    ).toBe(exp)
    // `exp` is inclusive: at exactly `exp` the grant is already gone.
    expect(() =>
      verifyStorageGrant(token, { grantSecret: SECRET }, new Date(exp * 1000)),
    ).toThrow(GrantExpiredError)
    expect(() =>
      verifyStorageGrant(
        token,
        { grantSecret: SECRET },
        new Date((exp + 60) * 1000),
      ),
    ).toThrow(GrantExpiredError)
  })

  test('an expired grant signed with an unknown secret is invalid, not expired', () => {
    const token = mint(claims({ exp: nowSeconds() - 60 }), 'not-configured')

    expect(() => verifyStorageGrant(token, { grantSecret: SECRET })).toThrow(
      InvalidGrantError,
    )
    expect(() =>
      verifyStorageGrant(token, { grantSecret: SECRET }),
    ).not.toThrow(GrantExpiredError)
  })

  test('reports expiry even when another configured key fails to verify', () => {
    const token = mint(claims({ exp: nowSeconds() - 60 }), OTHER_SECRET)

    expect(() =>
      verifyStorageGrant(token, { grantSecret: [SECRET, OTHER_SECRET] }),
    ).toThrow(GrantExpiredError)
  })

  test('rejects garbage and throws when no key is configured', () => {
    expect(() =>
      verifyStorageGrant('not-a-jwt', { grantSecret: SECRET }),
    ).toThrow(InvalidGrantError)
    expect(() => verifyStorageGrant(mint(claims(), SECRET), {})).toThrow(
      InvalidGrantError,
    )
    expect(() =>
      verifyStorageGrant(mint(claims(), SECRET), {
        grantSecret: [],
        grantPublicKey: undefined,
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
    expect(
      hasGrantKeys({ grantSecret: undefined, grantPublicKey: undefined }),
    ).toBe(false)
    expect(hasGrantKeys({ grantSecret: [] })).toBe(false)
    expect(hasGrantKeys({ grantSecret: '' })).toBe(false)
    expect(hasGrantKeys({ grantSecret: [''] })).toBe(false)
    expect(hasGrantKeys({ grantPublicKey: '' })).toBe(false)
    expect(hasGrantKeys({ grantSecret: SECRET })).toBe(true)
    expect(hasGrantKeys({ grantSecret: ['', SECRET] })).toBe(true)
    expect(hasGrantKeys({ grantPublicKey: ecPublicKey })).toBe(true)
  })
})
