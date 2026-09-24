import type { Readable } from 'node:stream'
import type {
  BuildUrl,
  CompanionContext,
  GrantDynamic,
  ProviderGrantConfig,
} from '../../types/express.js'
import { MAX_AGE_24H } from '../helpers/jwt.js'

// from express:
export interface Query {
  [key: string]: undefined | string | string[] | Query | Query[]
}

export type CompanionLike = Pick<
  CompanionContext,
  'getProviderCredentials' | 'options'
>

export interface ProviderListItem {
  isFolder: boolean
  icon: string | null | undefined
  id: string
  name?: string | undefined
  requestPath: string
  modifiedDate?: string | undefined
  mimeType?: string | null | undefined
  size?: number | null | undefined
  thumbnail?: string | null | undefined
}

export interface ProviderListOptions<US = unknown> {
  companion: CompanionContext
  directory?: string | undefined
  providerUserSession: US
  query?: Query
}

// todo use these types in the Uppy client
export interface ProviderListResponse {
  items: ProviderListItem[]
  nextPagePath?: string | null | undefined
  username?: string | null | undefined
}

export interface ProviderSearchOptions<US = unknown> {
  providerUserSession: US
  query: { q: string; path?: string; [k: string]: unknown }
  companion: { buildURL: BuildUrl }
}

export type ProviderSearchResponse = ProviderListResponse

export interface ProviderDownloadOptions<US = unknown> {
  companion: CompanionLike
  id: string
  providerUserSession: US
  query: Query
}

export interface ProviderDownloadResponse {
  stream: Readable
  size: number | undefined
}

export interface ProviderThumbnailOptions<US = unknown> {
  id: string
  providerUserSession: US
}

export interface ProviderThumbnailResponse {
  stream: Readable
  contentType?: string
}

export interface ProviderSizeOptions<US = unknown> {
  id: string
  providerUserSession: US
  query: Query
}

export interface ProviderDeauthorizationCallbackOptions {
  companion: CompanionLike
  body: unknown
  headers: Record<string, (string | string[]) | undefined>
}

export interface ProviderDeauthorizationCallbackResponse {
  data?: unknown
  status?: number
}

export interface ProviderRefreshTokenOptions {
  redirectUri: string | undefined
  clientId: string | undefined
  clientSecret: string | undefined
  refreshToken: string
}

export interface ProviderRefreshTokenResponse {
  accessToken: string
}

export interface ProviderLogoutOptions<US = unknown> {
  providerUserSession: US
  companion: CompanionLike
}

export interface ProviderLogoutResponse {
  revoked: boolean
  manual_revoke_url?: string
}

export interface ProviderSimpleAuthOptions {
  requestBody: unknown
}

interface ProviderGrantDynamicToUserSessionOptions {
  grantDynamic: GrantDynamic
}

/**
 * Provider interface defines the specifications of any provider implementation
 */
export default class Provider<US = unknown> {
  needsCookieAuth: boolean

  allowLocalUrls: boolean

  providerGrantConfig: ProviderGrantConfig | undefined

  constructor({
    allowLocalUrls,
    providerGrantConfig,
  }: {
    allowLocalUrls: boolean
    providerGrantConfig?: ProviderGrantConfig
  }) {
    // Some providers might need cookie auth for the thumbnails fetched via companion
    this.needsCookieAuth = false
    this.allowLocalUrls = allowLocalUrls
    this.providerGrantConfig = providerGrantConfig
    // biome-ignore lint/correctness/noConstructorReturn: ...
    return this
  }

  /**
   * config to extend the grant config
   */
  static getExtraGrantConfig(): Record<string, unknown> {
    return {}
  }

  /**
   * List the files and folders in the provider account.
   *
   * This method should be overridden by provider implementations.
   */
  async list(options: ProviderListOptions<US>): Promise<ProviderListResponse> {
    throw new Error('method not implemented')
  }

  /**
   * Search for files and folders in the provider account.
   *
   * This method should be overridden by provider implementations.
   */
  async search(
    options: ProviderSearchOptions<US>,
  ): Promise<ProviderSearchResponse> {
    throw new Error('method not implemented')
  }

  /**
   * Download a certain file from the provider account.
   *
   * This method should be overridden by provider implementations.
   */
  async download(
    options: ProviderDownloadOptions<US>,
  ): Promise<ProviderDownloadResponse> {
    throw new Error('method not implemented')
  }

  /**
   * Return a thumbnail for a provider file.
   *
   * This method should be overridden by provider implementations.
   */
  async thumbnail(
    options: ProviderThumbnailOptions<US>,
  ): Promise<ProviderThumbnailResponse> {
    throw new Error('method not implemented')
  }

  /**
   * first Companion will try to get the size from the content-length response header,
   * if that fails, it will call this method to get the size.
   * So if your provider has a different method for getting the size, you can return the size here
   */
  async size(options: ProviderSizeOptions<US>): Promise<number | undefined> {
    return undefined
  }

  /**
   * Handle deauthorization notification from OAuth providers.
   *
   * This method should be overridden by provider implementations.
   */
  async deauthorizationCallback(
    options: ProviderDeauthorizationCallbackOptions,
  ): Promise<ProviderDeauthorizationCallbackResponse> {
    throw new Error('method not implemented')
  }

  /**
   * Generate a new access token based on the refresh token
   */
  async refreshToken(
    options: ProviderRefreshTokenOptions,
  ): Promise<ProviderRefreshTokenResponse> {
    throw new Error('method not implemented')
  }

  /**
   * Revoke/logout for a provider session (if supported).
   *
   * This method should be overridden by provider implementations.
   */
  async logout(
    options: ProviderLogoutOptions<US>,
  ): Promise<ProviderLogoutResponse> {
    throw new Error('method not implemented')
  }

  async simpleAuth(options: ProviderSimpleAuthOptions): Promise<object> {
    throw new Error('method not implemented')
  }

  /**
   * Name of the OAuth provider (passed to Grant). Return empty string if no OAuth provider is needed.
   */
  static get oauthProvider(): string | undefined {
    return undefined
  }

  static grantDynamicToUserSession(
    options: ProviderGrantDynamicToUserSessionOptions,
  ): Record<string, unknown> {
    return {}
  }

  static get hasSimpleAuth(): boolean {
    return false
  }

  static get authStateExpiry(): number {
    return MAX_AGE_24H
  }
}

export type ProviderCtor = typeof Provider

// OAuth providers are those that have an `oauthProvider` set. It means they require OAuth authentication to work
export const isOAuthProvider = (
  oauthProvider: string | undefined,
): oauthProvider is string =>
  typeof oauthProvider === 'string' && oauthProvider.length > 0
