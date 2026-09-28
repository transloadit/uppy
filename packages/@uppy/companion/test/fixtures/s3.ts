import jwt, { type Algorithm } from 'jsonwebtoken'

/** The HS256 secret the tests' storage grants are signed with. */
export const GRANT_SECRET = 'grant-secret-one'

export const nowSeconds = (): number => Math.floor(Date.now() / 1000)

/** Claims of a storage grant; loosely typed so malformed ones can be minted. */
export type GrantClaims = Record<string, unknown>

/** A valid v1 grant payload, with `overrides` applied. */
export const claims = (overrides: GrantClaims = {}): GrantClaims => ({
  v: 1,
  bucket: 'my-bucket',
  prefix: 'tenant-1/',
  scopes: ['read'],
  exp: nowSeconds() + 900,
  ...overrides,
})

export const mint = (
  payload: GrantClaims,
  key: string,
  algorithm: Algorithm = 'HS256',
): string => jwt.sign(payload, key, { algorithm })
