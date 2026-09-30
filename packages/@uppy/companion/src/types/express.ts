import type { S3Client } from '@aws-sdk/client-s3'
import type { CredentialsFetchResponse } from '../schemas/companion.js'
import type Provider from '../server/provider/Provider.js'
import type { CompanionRuntimeOptions } from './companion-options.js'

export type BuildUrl = (
  subPath: string,
  isExternal: boolean,
  excludeHost?: boolean,
) => string

export interface ProviderGrantConfig {
  dynamic?: string[]
  redirect_uri?: string | undefined
}

export interface ProviderUserSession {
  accessToken?: string
  refreshToken?: string | undefined
  /**
   * When the provider's session expires, in unix seconds. A session that
   * expires earlier than `authStateExpiry` caps the session token to it.
   */
  exp?: number
  [key: string]: unknown
}

export type CompanionContext = {
  options: CompanionRuntimeOptions
  provider?: Provider
  providerName?: string
  providerClass?: typeof Provider
  providerGrantConfig?: ProviderGrantConfig
  providerUserSession?: ProviderUserSession | undefined
  authToken?: string | undefined
  buildURL?: BuildUrl
  s3Client?: S3Client
  s3ClientCreatePresignedPost?: S3Client
  /** The S3 provider's clients, one per bucket it has served, for the app's lifetime. */
  s3ProviderClients: Map<string, S3Client>
  getProviderCredentials?: () => Promise<CredentialsFetchResponse | null>
}

export interface GrantDynamic {
  state?: string
}

export interface CompanionExpressLocals {
  grant?: {
    dynamic?: {
      key?: string
      secret?: string
      origins?: string[]
      redirect_uri?: string
    } | null
  }
}

declare global {
  namespace Express {
    interface Request {
      companion: CompanionContext
      id?: string
      cookies?: Record<string, string>
    }
  }
}

declare module 'express-session' {
  export interface Session {
    grant?: {
      state?: string | null
      dynamic?: GrantDynamic | null
      response?: {
        access_token?: string
        refresh_token?: string
      }
    }
  }
}
