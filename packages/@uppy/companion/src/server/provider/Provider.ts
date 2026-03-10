import type { Readable } from 'node:stream'
import type {
  BuildUrl,
  CompanionContext,
  ProviderGrantConfig,
} from '../../types/express.js'
import { MAX_AGE_24H } from '../helpers/jwt.ts'

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

// todo use these types in the Uppy client
export interface ProviderListResponse {
  items: ProviderListItem[]
  nextPagePath?: string | null | undefined
  username?: string | null | undefined
}

export type ProviderSearchResponse = ProviderListResponse

/**
 * Provider interface defines the specifications of any provider implementation
 */
export default class Provider<US = unknown> {
  needsCookieAuth: boolean

  allowLocalUrls: boolean

  providerGrantConfig: ProviderGrantConfig | undefined

  secret: string | undefined

  constructor({
    allowLocalUrls,
    providerGrantConfig,
    secret,
  }: {
    allowLocalUrls: boolean
    providerGrantConfig?: ProviderGrantConfig
    secret: string | undefined
  }) {
    // Some providers might need cookie auth for the thumbnails fetched via companion
    this.needsCookieAuth = false
    this.allowLocalUrls = allowLocalUrls
    this.providerGrantConfig = providerGrantConfig
    this.secret = secret
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
  async list(options: {
    companion: CompanionContext
    directory?: string | undefined
    providerUserSession: US
    query?: Query
  }): Promise<ProviderListResponse> {
    // todo type return values and use them in the Uppy client
    throw new Error('method not implemented')
  }

  /**
   * Search for files and folders in the provider account.
   *
   * This method should be overridden by provider implementations.
   */
  async search(options: {
    providerUserSession: US
    query: { q: string; path?: string; [k: string]: unknown }
    companion: { buildURL: BuildUrl }
  }): Promise<ProviderSearchResponse> {
    throw new Error('method not implemented')
  }

  /**
   * Download a certain file from the provider account.
   *
   * This method should be overridden by provider implementations.
   */
  async download(options: {
    id: string
    providerUserSession: US
    query: Query
  }): Promise<{ stream: Readable; size: number | undefined }> {
    throw new Error('method not implemented')
  }

  /**
   * Return a thumbnail for a provider file.
   *
   * This method should be overridden by provider implementations.
   */
  async thumbnail(options: {
    id: string
    providerUserSession: US
  }): Promise<{ stream: Readable; contentType?: string }> {
    throw new Error('method not implemented')
  }

  /**
   * first Companion will try to get the size from the content-length response header,
   * if that fails, it will call this method to get the size.
   * So if your provider has a different method for getting the size, you can return the size here
   */
  async size(options: {
    id: string
    providerUserSession: US
    query: unknown
  }): Promise<number | undefined> {
    return undefined
  }

  /**
   * Handle deauthorization notification from OAuth providers.
   *
   * This method should be overridden by provider implementations.
   */
  async deauthorizationCallback(options: {
    companion: CompanionLike
    body: unknown
    headers: Record<string, (string | string[]) | undefined>
  }): Promise<{ data?: unknown; status?: number }> {
    throw new Error('method not implemented')
  }

  /**
   * Generate a new access token based on the refresh token
   */
  async refreshToken(options: {
    redirectUri: string | undefined
    clientId: string | undefined
    clientSecret: string | undefined
    refreshToken: string
  }): Promise<{ accessToken: string }> {
    throw new Error('method not implemented')
  }

  /**
   * Revoke/logout for a provider session (if supported).
   *
   * This method should be overridden by provider implementations.
   */
  async logout(options: {
    providerUserSession: US
    companion: CompanionLike
  }): Promise<{ revoked: boolean; manual_revoke_url?: string }> {
    throw new Error('method not implemented')
  }

  async simpleAuth({
    requestBody,
  }: {
    requestBody: unknown
  }): Promise<unknown> {
    throw new Error('method not implemented')
  }

  /**
   * Name of the OAuth provider (passed to Grant). Return empty string if no OAuth provider is needed.
   */
  static get oauthProvider(): string | undefined {
    return undefined
  }

  static grantDynamicToUserSession({
    grantDynamic,
  }: {
    grantDynamic: Record<string, unknown>
  }): Record<string, unknown> {
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
