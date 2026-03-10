import type { ObjectCannedACL, S3ClientConfig } from '@aws-sdk/client-s3'
import type { PresignedPostOptions } from '@aws-sdk/s3-presigned-post'
import type { CorsOptions } from 'cors'
import type { Request } from 'express'
import type { RedisOptions } from 'ioredis'
import type Provider from '../server/provider/Provider.ts'
import type { ProviderGrantConfig } from '../types/express.js'
import type { ProviderOptions, ServerConfig } from './common.ts'

// todo implement zod schema validation and remove manual typeof validation around in the code, also in providers/adapters
type ProviderConstructor = typeof Provider

export interface CustomProvider {
  module: ProviderConstructor
  config: ProviderGrantConfig
}

export type CompanionInitOptions = {
  secret?: string | undefined
  preAuthSecret?: string | Buffer | undefined
  loggerProcessName?: string | undefined
  server?: ServerConfig | undefined
  providerOptions?: ProviderOptions | undefined
  customProviders?: Record<string, CustomProvider> | undefined
  redisUrl?: string | undefined
  redisOptions?: RedisOptions | undefined
  redisPubSubScope?: string | undefined
  sendSelfEndpoint?: string | undefined
  enableUrlEndpoint?: boolean | undefined
  enableGooglePickerEndpoint?: boolean | undefined
  metrics?: boolean | undefined

  // Used internally by Companion:
  filePath?: string | undefined
  periodicPingUrls?: string[] | undefined
  periodicPingInterval?: number | undefined
  periodicPingCount?: number | undefined
  testDynamicOauthCredentials?: boolean | undefined
  testDynamicOauthCredentialsSecret?: string | undefined
  allowLocalUrls?: boolean | undefined
  clientSocketConnectTimeout?: number | undefined

  corsOrigins?: CorsOptions['origin'] | undefined
  periodicPingStaticPayload?: unknown
  s3?: {
    /** @deprecated */
    accessKeyId?: unknown
    /** @deprecated */
    secretAccessKey?: unknown

    region?: string | undefined
    endpoint?: string | undefined
    bucket?: string | GetBucketFn | undefined
    key?: string | undefined
    getKey?: GetKeyFn | undefined
    secret?: string | undefined
    sessionToken?: string | undefined
    conditions?: PresignedPostOptions['Conditions'] | undefined
    forcePathStyle?: boolean
    acl?: ObjectCannedACL | undefined
    useAccelerateEndpoint?: boolean
    expires: number
    awsClientOptions?: S3ClientConfig & {
      /** @deprecated */
      accessKeyId?: unknown
      /** @deprecated */
      secretAccessKey?: unknown
    }
  }
  maxFilenameLength?: number | undefined
  uploadUrls?: RegExp[] | string[] | undefined | null
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
