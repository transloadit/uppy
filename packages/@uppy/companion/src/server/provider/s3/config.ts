/**
 * Options of the S3 provider and of the `transloadit-storage` provider,
 * parsed once. Companion's startup validation and the providers themselves
 * both go through this, so there is one definition of what a valid block is.
 */
import { z } from 'zod'
import {
  type GrantKeys,
  hasGrantKeys,
  normalizeStorageGrantPrefix,
} from './grant.js'

/**
 * How the S3 provider opens sessions, decided by Companion's configuration
 * (never by the client):
 * - **grant** mode (`grantSecret` / `grantPublicKey`): the client presents a
 *   short-lived JWT minted by the integrator's server after it authenticated
 *   the user; bucket, prefix and write access come from it.
 * - **bucket** mode (`bucket`): everyone who can reach Companion gets the
 *   configured bucket and prefix.
 */
export type ParsedS3ProviderOptions =
  | { mode: 'grant'; keys: GrantKeys }
  | { mode: 'bucket'; bucket: string; prefix: string }

/** Native Transloadit Storage: catalog moves and per-Workspace credentials. */
export type NativeStorage = {
  apiEndpoint: string
  workspaces: Record<string, { key: string; secret: string }>
}

export type ParsedTransloaditStorageOptions = {
  mode: 'grant'
  keys: GrantKeys
  native: NativeStorage
}

/** Something the operator has to fix; the message says what. */
export class S3ConfigError extends Error {
  override name = 'S3ConfigError'
}

const keyList = z.union([z.string(), z.array(z.string())]).optional()
const grantKeyFields = { grantSecret: keyList, grantPublicKey: keyList }

/**
 * A field that must not be set. `providerOptions.s3` used to be where the
 * upload settings lived, so an upload-only field there is the old config; the
 * message says where it belongs now.
 */
const notHere = (message: string) => z.never({ error: message }).optional()

const uploadOnly = (field: string) =>
  notHere(
    `is an upload setting: use "s3.${field}" instead (the top-level "s3" block configures uploads, "providerOptions.s3" configures the S3 provider)`,
  )

/**
 * The two modes are exclusive: either `bucket` (with an optional `prefix`)
 * names the one bucket everybody browses, or a grant key makes each grant name
 * its own bucket and prefix. Setting both is a mistake (typically a
 * development bucket left next to production grant keys), and setting neither
 * leaves the provider unable to serve anything; both are refused.
 */
const s3ProviderOptionsSchema = z
  .object({
    bucket: z.string().min(1).optional(),
    prefix: z.string().optional(),
    ...grantKeyFields,
    getKey: uploadOnly('getKey'),
    conditions: uploadOnly('conditions'),
    expires: uploadOnly('expires'),
    useAccelerateEndpoint: uploadOnly('useAccelerateEndpoint'),
  })
  .transform((s3, ctx): ParsedS3ProviderOptions => {
    if (hasGrantKeys(s3)) {
      if (s3.bucket != null || s3.prefix != null) {
        ctx.addIssue({
          code: 'custom',
          path: [s3.bucket != null ? 'bucket' : 'prefix'],
          message:
            'cannot be combined with a grant key (`grantSecret` / `grantPublicKey`): each grant names the bucket and prefix it allows',
        })
        return z.NEVER
      }
      return { mode: 'grant', keys: s3 }
    }
    if (s3.bucket != null) {
      return {
        mode: 'bucket',
        bucket: s3.bucket,
        prefix: normalizeStorageGrantPrefix(s3.prefix ?? ''),
      }
    }
    ctx.addIssue({
      code: 'custom',
      message:
        'set either `bucket` (single-tenant) or a grant key (`grantSecret` / `grantPublicKey`, multi-tenant)',
    })
    return z.NEVER
  })

/** Native Transloadit Storage: grants only, and a key pair per Workspace. */
const transloaditStorageProviderOptionsSchema = z
  .object({
    ...grantKeyFields,
    bucket: notHere(
      'native Storage takes no bucket: each grant names its Workspace',
    ),
    prefix: notHere('native Storage takes no prefix: each grant names its own'),
    apiEndpoint: z.string().url(),
    workspaces: z.record(
      z.string().min(1),
      z.object({ key: z.string().min(1), secret: z.string().min(1) }),
    ),
  })
  .transform((own, ctx): ParsedTransloaditStorageOptions => {
    if (!hasGrantKeys(own)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'set a grant key (`grantSecret` / `grantPublicKey`); native Storage takes no `bucket`',
      })
      return z.NEVER
    }
    const { apiEndpoint, workspaces } = own
    return { mode: 'grant', keys: own, native: { apiEndpoint, workspaces } }
  })

function parseOrThrow<T>(
  label: string,
  schema: z.ZodType<T>,
  value: unknown,
): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new S3ConfigError(
      `Invalid ${label}: ${z.prettifyError(result.error)}`,
    )
  }
  return result.data
}

/** Parses `providerOptions.s3`; throws an {@link S3ConfigError} that says what is wrong. */
export function parseS3ProviderOptions(own: unknown): ParsedS3ProviderOptions {
  return parseOrThrow('providerOptions.s3', s3ProviderOptionsSchema, own)
}

/** Parses `providerOptions['transloadit-storage']`; throws an {@link S3ConfigError}. */
export function parseTransloaditStorageProviderOptions(
  own: unknown,
): ParsedTransloaditStorageOptions {
  return parseOrThrow(
    "providerOptions['transloadit-storage']",
    transloaditStorageProviderOptionsSchema,
    own,
  )
}
