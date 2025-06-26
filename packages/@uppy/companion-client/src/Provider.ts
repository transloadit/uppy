import type {
  Body,
  Meta,
  PluginOpts,
  UnknownProviderPlugin,
  Uppy,
} from '@uppy/core'
import type {
  CompanionClientProvider,
  RequestOptions,
} from '@uppy/utils/lib/CompanionClientProvider'
import { isOriginAllowed } from './getAllowedHosts.js'
import type { CompanionPluginOptions } from './index.js'
import RequestClient, { authErrorStatusCode } from './RequestClient.js'

export interface Opts extends PluginOpts, CompanionPluginOptions {
  pluginId: string
  name?: string
  supportsRefreshToken?: boolean
  provider: string
}

const getName = (id: string) => {
  return id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

function getOrigin() {
  return location.origin
}

export default class Provider<M extends Meta, B extends Body>
  extends RequestClient<M, B>
  implements CompanionClientProvider
{
  #refreshingTokenPromise: Promise<void> | undefined

  provider: string

  id: string

  name: string

  pluginId: string

  tokenKey: string

  companionKeysParams?: Record<string, string>

  preAuthToken: string | null

  supportsRefreshToken: boolean

  constructor(uppy: Uppy<M, B>, opts: Opts) {
    super(uppy, opts)
    this.provider = opts.provider
    this.id = this.provider
    this.name = this.opts.name || getName(this.id)
    this.pluginId = this.opts.pluginId
    this.tokenKey = `companion-${this.pluginId}-auth-token`
    this.companionKeysParams = this.opts.companionKeysParams
    this.preAuthToken = null
    this.supportsRefreshToken = !!opts.supportsRefreshToken
  }

  async headers(): Promise<Record<string, string>> {
    const [headers, token] = await Promise.all([
      super.headers(),
      this.#getAuthToken(),
    ])
    const authHeaders: Record<string, string> = {}
    if (token) {
      authHeaders['uppy-auth-token'] = token
    }

    if (this.companionKeysParams) {
      authHeaders['uppy-credentials-params'] = btoa(
        JSON.stringify({ params: this.companionKeysParams }),
      )
    }
    return { ...headers, ...authHeaders }
  }

  onReceiveResponse(response: Response): Response {
    super.onReceiveResponse(response)
    const plugin = this.#getPlugin()
    const oldAuthenticated = plugin.getPluginState().authenticated
    const authenticated = oldAuthenticated
      ? response.status !== authErrorStatusCode
      : response.status < 400
    plugin.setPluginState({ authenticated })
    return response
  }

  async setAuthToken(token: string): Promise<void> {
    return this.#getPlugin().storage.setItem(this.tokenKey, token)
  }

  async #getAuthToken(): Promise<string | null> {
    return this.#getPlugin().storage.getItem(this.tokenKey)
  }

  protected async removeAuthToken(): Promise<void> {
    return this.#getPlugin().storage.removeItem(this.tokenKey)
  }

  #getPlugin() {
    const plugin = this.uppy.getPlugin(this.pluginId) as UnknownProviderPlugin<
      M,
      B
    >
    if (plugin == null) throw new Error('Plugin was nullish')
    return plugin
  }

  /**
   * Ensure we have a preauth token if necessary. Attempts to fetch one if we don't,
   * or rejects if loading one fails.
   */
  async ensurePreAuth(): Promise<void> {
    if (this.companionKeysParams && !this.preAuthToken) {
      await this.fetchPreAuthToken()

      if (!this.preAuthToken) {
        throw new Error(
          'Could not load authentication data required for third-party login. Please try again later.',
        )
      }
    }
  }

  authQuery(data: unknown): Record<string, string> {
    return {}
  }

  authUrl({
    authFormData,
    query,
  }: {
    authFormData: unknown
    query: Record<string, string>
  }): string {
    const params = new URLSearchParams({
      ...query,
      // This is only used for Companion instances configured to accept multiple origins.
      state: btoa(JSON.stringify({ origin: getOrigin() })),
      ...this.authQuery({ authFormData }),
    })

    if (this.preAuthToken) {
      params.set('uppyPreAuthToken', this.preAuthToken)
    }

    return `${this.hostname}/${this.id}/connect?${params}`
  }

  protected async loginSimpleAuth({
    uppyVersions,
    authFormData,
    signal,
  }: {
    uppyVersions: string
    authFormData: unknown
    signal: AbortSignal
  }): Promise<void> {
    type Res = { uppyAuthToken: string }
    const response = await this.post<Res>(
      `${this.id}/simple-auth`,
      { form: authFormData },
      { qs: { uppyVersions }, signal },
    )
    this.setAuthToken(response.uppyAuthToken)
  }

  protected async loginOAuth({
    uppyVersions,
    authFormData,
    signal,
  }: {
    uppyVersions: string
    authFormData: unknown
    signal: AbortSignal
  }): Promise<void> {
    await this.ensurePreAuth()

    signal.throwIfAborted()

    const link = this.authUrl({ query: { uppyVersions }, authFormData })
    const authWindow = window.open(link, '_blank')
    let interval: number | undefined
    let handleMessage: ((e: MessageEvent<any>) => void) | undefined

    try {
      return await new Promise((resolve, reject) => {
        handleMessage = (e: MessageEvent<any>) => {
          if (e.source !== authWindow) {
            let jsonData = ''
            try {
              // TODO improve our uppy logger so that it can take an arbitrary number of arguments,
              // each either objects, errors or strings,
              // then we don’t have to manually do these things like json stringify when logging.
              // the logger should never throw an error.
              jsonData = JSON.stringify(e.data)
            } catch (_err) {
              // in case JSON.stringify fails (ignored)
            }
            this.uppy.log(
              `ignoring event from unknown source ${jsonData}`,
              'warning',
            )
            return
          }

          const { companionAllowedHosts } = this.#getPlugin().opts
          if (!isOriginAllowed(e.origin, companionAllowedHosts)) {
            this.uppy.log(
              `ignoring event from ${e.origin} vs allowed pattern ${companionAllowedHosts}`,
              'warning',
            )
            // We cannot reject here because the page might send events from other origins
            // before sending the "real" auth completed event.
            // for example Box has a "Pendo" tool that sends events to the opener
            // https://github.com/transloadit/uppy/pull/5719
            return
          }

          // Check if it's a string before doing the JSON.parse to maintain support
          // for older Companion versions that used object references
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data

          if (data.error) {
            const { uppy } = this
            const message = uppy.i18n('authAborted')
            uppy.info({ message }, 'warning', 5000)
            reject(new Error('auth aborted'))
            return
          }

          if (!data.token) {
            reject(new Error('did not receive token from auth window'))
            return
          }

          resolve(this.setAuthToken(data.token))
        }

        // poll for user closure of the window, so we can reject when it happens
        if (authWindow) {
          interval = window.setInterval(() => {
            if (authWindow.closed) {
              reject(new Error('Auth window was closed by the user'))
            }
          }, 500)
        }

        signal.addEventListener('abort', () => reject(new Error('Aborted')))
        window.addEventListener('message', handleMessage)
      })
    } finally {
      // cleanup:
      authWindow?.close()
      window.clearInterval(interval)
      if (handleMessage) window.removeEventListener('message', handleMessage)
    }
  }

  async login({
    uppyVersions,
    authFormData,
    signal,
  }: {
    uppyVersions: string
    authFormData: unknown
    signal: AbortSignal
  }): Promise<void> {
    return this.loginOAuth({ uppyVersions, authFormData, signal })
  }

  refreshTokenUrl(): string {
    return `${this.hostname}/${this.id}/refresh-token`
  }

  fileUrl(id: string): string {
    return `${this.hostname}/${this.id}/get/${id}`
  }

  protected async request<ResBody>(
    ...args: Parameters<RequestClient<M, B>['request']>
  ): Promise<ResBody> {
    await this.#refreshingTokenPromise

    try {
      // to test simulate access token expired (leading to a token token refresh),
      // see mockAccessTokenExpiredError in companion/drive.
      // If you want to test refresh token *and* access token invalid, do this for example with Google Drive:
      // While uploading, go to your google account settings,
      // "Third-party apps & services", then click "Companion" and "Remove access".

      return await super.request<ResBody>(...args)
    } catch (err) {
      if (!this.supportsRefreshToken) throw err
      // only handle auth errors (401 from provider), and only handle them if we have a (refresh) token
      const authTokenAfter = await this.#getAuthToken()
      if (!err.isAuthError || !authTokenAfter) throw err

      if (this.#refreshingTokenPromise == null) {
        // Many provider requests may be starting at once, however refresh token should only be called once.
        // Once a refresh token operation has started, we need all other request to wait for this operation (atomically)
        this.#refreshingTokenPromise = (async () => {
          try {
            this.uppy.log(`[CompanionClient] Refreshing expired auth token`)
            const response = await super.request<{ uppyAuthToken: string }>({
              path: this.refreshTokenUrl(),
              method: 'POST',
            })
            await this.setAuthToken(response.uppyAuthToken)
          } catch (refreshTokenErr) {
            if (refreshTokenErr.isAuthError) {
              // if refresh-token has failed with auth error, delete token, so we don't keep trying to refresh in future
              await this.removeAuthToken()
            }
            throw err
          } finally {
            this.#refreshingTokenPromise = undefined
          }
        })()
      }

      await this.#refreshingTokenPromise

      // now retry the request with our new refresh token
      return super.request(...args)
    }
  }

  async fetchPreAuthToken(): Promise<void> {
    if (!this.companionKeysParams) {
      return
    }

    try {
      const res = await this.post<{ token: string }>(`${this.id}/preauth/`, {
        params: this.companionKeysParams,
      })
      this.preAuthToken = res.token
    } catch (err) {
      this.uppy.log(
        `[CompanionClient] unable to fetch preAuthToken ${err}`,
        'warning',
      )
    }
  }

  list<ResBody>(
    directory: string | null,
    options: RequestOptions,
  ): Promise<ResBody> {
    return this.get<ResBody>(`${this.id}/list/${directory || ''}`, options)
  }

  async logout<ResBody>(options?: RequestOptions): Promise<ResBody> {
    const response = await this.get<ResBody>(`${this.id}/logout`, options)
    await this.removeAuthToken()
    return response
  }
}
