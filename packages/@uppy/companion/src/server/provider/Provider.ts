import { MAX_AGE_24H } from '../helpers/jwt.ts'

/**
 * Provider interface defines the specifications of any provider implementation
 */
export default class Provider {
  needsCookieAuth: boolean

  allowLocalUrls: boolean

  providerGrantConfig: Record<string, unknown> | undefined

  secret: string

  constructor({
    allowLocalUrls,
    providerGrantConfig,
    secret,
  }: {
    allowLocalUrls: boolean
    providerGrantConfig?: Record<string, unknown>
    secret: string
  } & Record<string, unknown>) {
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
  async list(options: unknown): Promise<unknown> {
    throw new Error('method not implemented')
  }

  /**
   * Search for files and folders in the provider account.
   *
   * This method should be overridden by provider implementations.
   */
  async search(options: unknown): Promise<unknown> {
    throw new Error('method not implemented')
  }

  /**
   * Download a certain file from the provider account.
   *
   * This method should be overridden by provider implementations.
   */
  async download(options: unknown): Promise<unknown> {
    throw new Error('method not implemented')
  }

  /**
   * Return a thumbnail for a provider file.
   *
   * This method should be overridden by provider implementations.
   */
  async thumbnail(options: unknown): Promise<unknown> {
    throw new Error('method not implemented')
  }

  /**
   * first Companion will try to get the size from the content-length response header,
   * if that fails, it will call this method to get the size.
   * So if your provider has a different method for getting the size, you can return the size here
   */
  async size(options: unknown): Promise<unknown> {
    return undefined
  }

  /**
   * Handle deauthorization notification from OAuth providers.
   *
   * This method should be overridden by provider implementations.
   */
  async deauthorizationCallback(options: unknown): Promise<unknown> {
    throw new Error('method not implemented')
  }

  /**
   * Generate a new access token based on the refresh token
   */
  async refreshToken(options: unknown): Promise<unknown> {
    throw new Error('method not implemented')
  }

  /**
   * Revoke/logout for a provider session (if supported).
   *
   * This method should be overridden by provider implementations.
   */
  async logout(options: unknown): Promise<unknown> {
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

// OAuth providers are those that have an `oauthProvider` set. It means they require OAuth authentication to work
export const isOAuthProvider = (
  oauthProvider: unknown,
): oauthProvider is string =>
  typeof oauthProvider === 'string' && oauthProvider.length > 0
