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

/** A verified grant, reduced to what the provider acts on. */
export type StorageGrant = {
  bucket: string
  /** Normalised: no leading slashes, trailing slash unless empty. */
  prefix: string
  write: boolean
  /** Unix seconds. */
  exp: number
  sub?: string
}

/** The keys Companion accepts grants from. Several allow key rotation. */
export type GrantKeys = {
  /** HS256 secret(s); several for rotation. */
  secrets?: string | string[] | undefined
  /** PEM public key(s) for ES256/384/512, RS256/384/512, PS256/384/512. */
  publicKeys?: string | string[] | undefined
}

/** The grant verified, but its `exp` has passed. */
export class GrantExpiredError extends Error {
  constructor(message = 'The storage grant has expired') {
    super(message)
    this.name = 'GrantExpiredError'
  }
}

/** The grant did not verify, or its claims are not a v1 grant. */
export class InvalidGrantError extends Error {
  constructor(message = 'Invalid storage grant') {
    super(message)
    this.name = 'InvalidGrantError'
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
const toKeyList = (keys: string | string[] | undefined): string[] => {
  if (keys === undefined) return []
  const list = typeof keys === 'string' ? [keys] : keys
  return list.filter((key) => key.trim().length > 0)
}

/** Whether Companion is configured to accept grants at all. */
export function hasGrantKeys(keys: GrantKeys): boolean {
  return (
    toKeyList(keys.secrets).length > 0 || toKeyList(keys.publicKeys).length > 0
  )
}

/** Companion's prefix policy: no leading slashes, a trailing slash unless empty. */
export function normalizeStorageGrantPrefix(prefix: string): string {
  const cleaned = prefix.replace(/^\/+/, '')
  return cleaned.length === 0 || cleaned.endsWith('/') ? cleaned : `${cleaned}/`
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
  const candidates: { key: string; algorithms: Algorithm[] }[] = [
    ...toKeyList(keys.secrets).map((key) => ({
      key,
      algorithms: SECRET_ALGORITHMS,
    })),
    ...toKeyList(keys.publicKeys).map((key) => ({
      key,
      algorithms: PUBLIC_KEY_ALGORITHMS,
    })),
  ]
  if (candidates.length === 0) throw new InvalidGrantError()

  const options = {
    clockTimestamp:
      now === undefined ? undefined : Math.floor(now.getTime() / 1000),
  }

  let payload: unknown
  let verified = false
  // A TokenExpiredError can only come from a key whose signature matched, so
  // it is worth reporting even when a later key fails for another reason.
  let expired = false

  for (const candidate of candidates) {
    try {
      payload = jwt.verify(token, candidate.key, {
        ...options,
        algorithms: candidate.algorithms,
      })
      verified = true
      break
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) expired = true
    }
  }

  if (!verified) {
    if (expired) throw new GrantExpiredError()
    throw new InvalidGrantError()
  }

  const parsed = grantClaimsSchema.safeParse(payload)
  if (!parsed.success) throw new InvalidGrantError()
  const claims = parsed.data

  return {
    bucket: claims.bucket,
    prefix: normalizeStorageGrantPrefix(claims.prefix),
    write: claims.scopes.includes('write'),
    exp: claims.exp,
    ...(claims.sub === undefined ? {} : { sub: claims.sub }),
  }
}
