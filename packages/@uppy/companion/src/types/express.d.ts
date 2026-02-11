import type { S3Client } from '@aws-sdk/client-s3'
import type { CompanionRuntimeOptions } from './companion-options.ts'
import type Provider from '../server/provider/Provider.ts'

export type CompanionContext = {
  options: CompanionRuntimeOptions
  provider?: Provider
  providerName?: string
  providerClass?: typeof Provider
  providerGrantConfig?: Record<string, unknown>
  providerUserSession?: unknown
  authToken?: unknown
  buildURL?: (
    subPath: string,
    isExternal: boolean,
    excludeHost?: boolean,
  ) => string
  s3Client?: S3Client
  s3ClientCreatePresignedPost?: S3Client
  getProviderCredentials?: unknown
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Request {
      companion: CompanionContext
      id?: string
      cookies?: Record<string, string>
      session?: unknown
    }
  }
}
