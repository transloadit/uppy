import type { S3Client } from '@aws-sdk/client-s3'
import type { CompanionRuntimeOptions } from './companion-options.ts'
import type Provider from '../server/provider/Provider.ts'
import { CredentialsFetchResponse } from '../schemas/companion.ts'

export type BuildUrl = (
  subPath: string,
  isExternal: boolean,
  excludeHost?: boolean,
) => string

export interface ProviderGrantConfig {
  dynamic?: string[]
  redirect_uri?: string | undefined
}

export type CompanionContext = {
  options: CompanionRuntimeOptions
  provider?: Provider
  providerName?: string
  providerClass?: typeof Provider
  providerGrantConfig?: ProviderGrantConfig
  providerUserSession?: unknown
  authToken?: string | undefined
  buildURL?: BuildUrl
  s3Client?: S3Client
  s3ClientCreatePresignedPost?: S3Client
  getProviderCredentials?: () => Promise<CredentialsFetchResponse | null>
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Request {
      companion: CompanionContext
      id?: string
      cookies?: Record<string, string>
      session?: unknown // todo type
    }
  }
}
