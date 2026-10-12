/**
 * Storage grants: short-lived JWTs an integrator's server mints after it has
 * authenticated the user, carrying the bucket, the prefix the user may see and
 * the scopes they hold. Companion's S3 provider verifies them here.
 *
 * The wire format is fixed (v1): the payload is
 * `{ v: 1, bucket, prefix, scopes, exp, iat?, sub? }`. Grants may be signed
 * with a shared secret (HS256) or with an asymmetric key, in which case
 * Companion is configured with the public key only.
 */
import jwt, { type Algorithm } from 'jsonwebtoken'
import { z } from 'zod'
import type { S3ProviderOptions } from '../../../schemas/companion.js'

/** A verified grant, reduced to what the provider acts on. */
export type StorageGrant = {
  bucket: string
  /** Normalised: no leading slashes, trailing slash unless empty. */
  prefix: string
  write: boolean
  /** Unix seconds. */
  exp: number
}

/**
 * The keys Companion accepts grants from, as they appear in the provider's
 * options: HS256 secret(s) and/or PEM public keys (ES/RS/PS). Several of each
 * allow rotation.
 */
export type GrantKeys = Pick<
  S3ProviderOptions,
  'grantSecret' | 'grantPublicKey'
>

/** The grant verified, but its `exp` has passed. */
export class GrantExpiredError extends Error {
  override name = 'GrantExpiredError'

  constructor() {
    super('The storage grant has expired')
  }
}

/** The grant did not verify, or its claims are not a v1 grant. */
export class InvalidGrantError extends Error {
  override name = 'InvalidGrantError'

  constructor() {
    super('Invalid storage grant')
  }
}

/**
 * Algorithms a grant may be signed with, per key kind. `none` is never
 * allowed, and a secret can never verify an asymmetric signature (nor the
 * reverse), so a public key cannot be replayed as an HMAC secret.
 */
const SECRET_ALGORITHMS: Algorithm[] = ['HS256']
const PUBLIC_KEY_ALGORITHMS: Algorithm[] = [
  'ES256',
  'ES384',
  'ES512',
  'RS256',
  'RS384',
  'RS512',
  'PS256',
  'PS384',
  'PS512',
]

const grantClaimsSchema = z.object({
  v: z.literal(1),
  bucket: z.string().min(1),
  prefix: z.string(),
  // Fail closed: a grant that does not grant reading is not a session.
  scopes: z
    .array(z.enum(['read', 'write']))
    .refine((scopes) => scopes.includes('read')),
  exp: z.number(),
  iat: z.number().optional(),
  sub: z.string().optional(),
})

/** Drops unset and blank entries, so a key list is either real keys or empty. */
export const toKeyList = (keys: string | string[] | undefined): string[] => {
  if (keys === undefined) return []
  const list = typeof keys === 'string' ? [keys] : keys
  return list.filter((key) => key.trim().length > 0)
}

/** Whether Companion is configured to accept grants at all. */
export function hasGrantKeys(keys: GrantKeys): boolean {
  return (
    toKeyList(keys.grantSecret).length > 0 ||
    toKeyList(keys.grantPublicKey).length > 0
  )
}

/** Appends a `/` unless the value is empty or already ends with one. */
export const ensureTrailingSlash = (value: string): string =>
  value.length === 0 || value.endsWith('/') ? value : `${value}/`

/** Companion's prefix policy: no leading slashes, a trailing slash unless empty. */
export function normalizeStorageGrantPrefix(prefix: string): string {
  return ensureTrailingSlash(prefix.replace(/^\/+/, ''))
}

type KeyCandidate = { key: string; algorithms: Algorithm[] }

/**
 * Verifies `token` against every candidate and returns the claims of the first
 * one whose signature matches — including when there are no candidates at all,
 * which is simply a grant no key verifies.
 */
function verifyWithAnyKey(
  token: string,
  candidates: KeyCandidate[],
  clockTimestamp: number | undefined,
): unknown {
  // A TokenExpiredError can only come from a key whose signature matched, so
  // it is worth reporting even when a later key fails for another reason.
  let expired = false

  for (const candidate of candidates) {
    try {
      return jwt.verify(token, candidate.key, {
        clockTimestamp,
        algorithms: candidate.algorithms,
      })
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) expired = true
    }
  }

  if (expired) throw new GrantExpiredError()
  throw new InvalidGrantError()
}

/**
 * Verifies a grant against every configured key and returns its claims.
 *
 * Throws {@link GrantExpiredError} when the signature matched but the grant
 * has expired, and {@link InvalidGrantError} for everything else — which key
 * failed, and why, is deliberately not reported.
 */
export function verifyStorageGrant(
  token: string,
  keys: GrantKeys,
  now?: Date,
): StorageGrant {
  const candidates: KeyCandidate[] = [
    ...toKeyList(keys.grantSecret).map((key) => ({
      key,
      algorithms: SECRET_ALGORITHMS,
    })),
    ...toKeyList(keys.grantPublicKey).map((key) => ({
      key,
      algorithms: PUBLIC_KEY_ALGORITHMS,
    })),
  ]

  const payload = verifyWithAnyKey(
    token,
    candidates,
    now === undefined ? undefined : Math.floor(now.getTime() / 1000),
  )

  const parsed = grantClaimsSchema.safeParse(payload)
  if (!parsed.success) throw new InvalidGrantError()
  const claims = parsed.data

  return {
    bucket: claims.bucket,
    prefix: normalizeStorageGrantPrefix(claims.prefix),
    write: claims.scopes.includes('write'),
    exp: claims.exp,
  }
}
