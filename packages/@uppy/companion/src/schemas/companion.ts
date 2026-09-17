import type {
  ObjectCannedACL,
  S3ClientConfig,
  ServerSideEncryption,
} from '@aws-sdk/client-s3'
import type { PresignedPostOptions } from '@aws-sdk/s3-presigned-post'
import type { CorsOptions } from 'cors'
import type { Request } from 'express'
import type { RedisOptions } from 'ioredis'
import type Provider from '../server/provider/Provider.js'

// todo implement zod schema validation and remove manual typeof validation around in the code, also in providers/adapters
// see `validateConfig`

export interface ProviderOptions {
  key?: string | undefined
  secret?: string | undefined
  credentialsURL?: string | undefined
  verificationToken?: string | undefined
}

/**
 * Settings for connecting to an S3-compatible endpoint. Shared by the `s3`
 * upload block, the S3 provider (`providerOptions.s3`, which falls back to the
 * upload block field by field) and the S3 client factory, so the three cannot
 * drift apart.
 */
export interface S3ConnectionOptions {
  key?: string | undefined
  secret?: string | undefined
  sessionToken?: string | undefined
  region?: string | undefined
  endpoint?: string | undefined
  forcePathStyle?: boolean | undefined
  awsClientOptions?:
    | (S3ClientConfig & {
        /** @deprecated */
        accessKeyId?: unknown
        /** @deprecated */
        secretAccessKey?: unknown
      })
    | undefined
}

/** Attributes of the objects Companion writes: uploads, copies, folder markers. */
export interface S3ObjectWriteOptions {
  acl?: ObjectCannedACL | undefined
  /** Server-side encryption to request, e.g. `aws:kms`. */
  awsSse?: ServerSideEncryption | undefined
  /** KMS key id or ARN to use when `awsSse` is a KMS encryption type. */
  awsSseKmsKeyId?: string | undefined
}

/**
 * Options of the S3 *provider* (browsing and managing an S3-compatible bucket
 * from the Dashboard through `@uppy/s3`), configured under
 * `providerOptions.s3` like every other provider. It is separate from the `s3`
 * block, which configures *uploads* to S3: the two features may use different
 * credentials, accounts and buckets. Every connection and object-write setting
 * left unset here falls back to the same-named field of the `s3` upload block.
 *
 * The provider is disabled until either `bucket` (single-tenant: everyone who
 * can reach Companion browses that bucket, so put Companion behind your own
 * authentication) or a grant key (`grantSecret` / `grantPublicKey`,
 * multi-tenant: your server issues a short-lived grant per user) is set.
 * Restrict what the provider's credentials may do with IAM or a bucket
 * policy; Companion only enforces the per-user prefix carried by grants.
 */
export interface S3ProviderOptions
  extends ProviderOptions,
    S3ConnectionOptions,
    S3ObjectWriteOptions {
  /**
   * The bucket to browse when grants are not used. Exclusive with the grant
   * keys (Companion refuses to start with both): with grants, each grant
   * names its bucket.
   */
  bucket?: string | undefined
  /**
   * Key prefix inside `bucket` that browsing is confined to, e.g.
   * `uploads/`. Only together with `bucket`.
   */
  prefix?: string | undefined
  /**
   * Secret(s) that storage grants are signed with (HS256). A grant is a
   * short-lived JWT your own server mints after it authenticated the user,
   * carrying the bucket, the prefix they may see and whether they may write.
   * Pass several to rotate: grants signed with any of them verify. Distinct
   * from Companion's `secret`, which protects the session token Companion
   * hands back to the browser.
   */
  grantSecret?: string | string[] | undefined
  /**
   * PEM public key(s) for grants signed asymmetrically (ES256/384/512,
   * RS256/384/512, PS256/384/512). Preferred over `grantSecret`: Companion
   * can verify grants but not mint them.
   */
  grantPublicKey?: string | string[] | undefined
}

type ProviderConstructor = typeof Provider

export interface CustomProvider {
  module: ProviderConstructor
  config: ProviderOptions
}

export type CredentialsFetchResponse = Pick<
  ProviderOptions,
  'key' | 'secret' | 'verificationToken'
> & {
  transloadit_gateway?: string
  origins?: string[]
}

export interface CompanionInitOptions {
  // required:
  secret: string
  filePath: string
  server: {
    host: string
    protocol?: string | undefined
    path?: string | undefined
    implicitPath?: string | undefined
    oauthDomain?: string | undefined
    validHosts?: (string | RegExp)[] | undefined
  }

  // optional:
  preAuthSecret?: string | Buffer | undefined
  loggerProcessName?: string | undefined
  providerOptions?:
    | (Record<string, ProviderOptions> & { s3?: S3ProviderOptions | undefined })
    | undefined
  customProviders?: Record<string, CustomProvider> | undefined
  redisUrl?: string | undefined
  redisOptions?: RedisOptions | undefined
  redisPubSubScope?: string | undefined
  sendSelfEndpoint?: string | undefined
  enableUrlEndpoint?: boolean | undefined
  enableGooglePickerEndpoint?: boolean | undefined
  metrics?: boolean | undefined
  periodicPingUrls?: string[] | undefined
  periodicPingInterval?: number | undefined
  periodicPingCount?: number | undefined
  testDynamicOauthCredentials?: boolean | undefined
  testDynamicOauthCredentialsSecret?: string | undefined
  allowLocalUrls?: boolean | undefined
  clientSocketConnectTimeout?: number | undefined

  corsOrigins?: CorsOptions['origin'] | undefined
  periodicPingStaticPayload?: unknown
  /** Uploads to S3 (`@uppy/aws-s3`). The S3 *provider* is `providerOptions.s3`. */
  s3?: S3ConnectionOptions &
    S3ObjectWriteOptions & {
      /** @deprecated */
      accessKeyId?: unknown
      /** @deprecated */
      secretAccessKey?: unknown

      bucket?: string | GetBucketFn | undefined
      getKey?: GetKeyFn | undefined
      conditions?: PresignedPostOptions['Conditions'] | undefined
      useAccelerateEndpoint?: boolean
      expires: number
    }
  maxFilenameLength?: number | undefined
  uploadUrls?: (string | RegExp)[] | undefined | null
  cookieDomain?: string | undefined
  streamingUpload?: boolean | undefined
  tusDeferredUploadLength?: boolean | undefined
  maxFileSize?: number | undefined
  chunkSize?: number | undefined
  uploadHeaders?: Record<string, string> | undefined
}

export type GetKeyFn = (args: {
  req: Request
  filename: string
  metadata: Record<string, unknown>
}) => string

export type GetBucketFn = (args: {
  req: Request
  filename?: string | undefined
  metadata: Record<string, unknown>
}) => string
