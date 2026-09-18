import type { Readable } from 'node:stream'
import type {
  BuildUrl,
  CompanionContext,
  GrantDynamic,
  ProviderGrantConfig,
} from '../../types/express.js'
import { MAX_AGE_24H } from '../helpers/jwt.js'
import logger from '../logger.js'

// from express:
export interface Query {
  [key: string]: undefined | string | string[] | Query | Query[]
}

export type CompanionLike = Pick<
  CompanionContext,
  'getProviderCredentials' | 'options' | 's3ProviderClients'
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
  /** What the listing tells the client about the session it was served for. */
  session?: {
    /** Bucket (or equivalent container) the session is browsing. */
    bucket: string
    /** Whether the session may change files (delete, move, create folders). */
    canWrite: boolean
    /** Whether `moveItem` accepts a folder id and moves the whole folder itself. */
    supportsMoveFolder: boolean
    /** Root the session is confined to, which paths the user types are relative to. */
    prefix: string
  }
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
  async list(options: {
    companion: CompanionContext
    directory?: string | undefined
    providerUserSession: US
    query?: Query
  }): Promise<ProviderListResponse> {
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
    companion: CompanionLike
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

  /**
   * Opens a session without OAuth ("simple" is *not OAuth*, not *a login
   * form*): the client posts whatever this provider needs to `/simple-auth`
   * and gets a session token back. What is posted is up to the provider —
   * a form the user filled in (WebDAV's server URL) or credentials the app
   * fetched itself (the S3 provider's storage grant, exchanged with no UI).
   * The returned object is the provider's session, stored in the token and
   * handed back on every later request as `providerUserSession`.
   */
  async simpleAuth({
    requestBody,
    companion,
  }: {
    requestBody: unknown
    companion: CompanionLike
  }): Promise<object> {
    throw new Error('method not implemented')
  }

  /**
   * Delete a file or (empty) folder. Providers that support mutations override
   * this and set `supportsMutations` to true.
   */
  async deleteItem(options: {
    companion: CompanionLike
    id: string
    providerUserSession: US
  }): Promise<void> {
    throw new Error('method not implemented')
  }

  /**
   * Move or rename one item. `destination` is a full path/id in the provider's
   * own addressing scheme; the response carries the new id. Folders are
   * accepted only by providers whose listings report
   * `session.supportsMoveFolder`; otherwise the client moves a folder's
   * entries one by one through this and the other mutations.
   */
  async moveItem(options: {
    companion: CompanionLike
    id: string
    destination: string
    providerUserSession: US
  }): Promise<{ id: string; requestPath: string }> {
    throw new Error('method not implemented')
  }

  /**
   * Create a folder inside `parentId` (null for the root).
   */
  async createFolder(options: {
    companion: CompanionLike
    parentId: string | null
    name: string
    providerUserSession: US
  }): Promise<{ id: string; requestPath: string }> {
    throw new Error('method not implemented')
  }

  /**
   * Run `fn`, logging the original error under `tag` and rethrowing it
   * translated by `mapProviderError()`. Providers wrap their SDK calls in this
   * so error mapping and logging live in one place: the log keeps the error as
   * the provider threw it, and `mapProviderError()` stays a pure mapping.
   */
  protected async withErrorHandling<T>(
    tag: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn()
    } catch (err: unknown) {
      logger.error(err, tag)
      throw this.mapProviderError(err)
    }
  }

  /**
   * Translate an error from the provider's SDK/API into a Companion error
   * (ProviderAuthError, ProviderUserError, ProviderApiError). Pure: it maps and
   * returns, it does not log or throw. The default keeps the error as-is;
   * providers override this to add their mapping.
   */
  protected mapProviderError(err: unknown): unknown {
    return err
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
    grantDynamic: GrantDynamic
  }): Record<string, unknown> {
    return {}
  }

  /** Whether `simpleAuth()` is implemented (sessions are opened without OAuth). */
  static get hasSimpleAuth(): boolean {
    return false
  }

  /** Whether deleteItem/moveItem/createFolder are implemented. */
  static get supportsMutations(): boolean {
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
