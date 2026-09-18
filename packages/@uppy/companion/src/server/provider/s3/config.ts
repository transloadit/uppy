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
 * Fields that only ever configured *uploads*, so finding one under
 * `providerOptions.s3` means the config predates the S3 provider. `awsSse` and
 * the other credential/connection settings are shared by both, so they are not
 * listed here.
 */
const UPLOAD_ONLY_S3_FIELDS = [
  'getKey',
  'conditions',
  'expires',
  'useAccelerateEndpoint',
] as const

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
  // `providerOptions.s3` is *not* deprecated: it configures the S3 provider
  // (browsing a bucket), which is a different feature from the top-level `s3`
  // block (uploading to a bucket). It used to be where the upload settings
  // lived, though, so an upload-only field there is the old config.
  const uploadOnlyField = UPLOAD_ONLY_S3_FIELDS.find(
    (field) => own != null && Object.hasOwn(own, field),
  )
  if (uploadOnlyField != null) {
    throw new S3ConfigError(
      `The Provider option "providerOptions.s3.${uploadOnlyField}" is no longer supported. Please use the option "s3.${uploadOnlyField}" instead: the upload settings belong in the top-level "s3" block, while "providerOptions.s3" now configures the S3 provider.`,
    )
  }
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
