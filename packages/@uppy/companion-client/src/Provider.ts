import type {
  Body,
  Meta,
  PluginOpts,
  UnknownProviderPlugin,
  Uppy,
} from '@uppy/core'
import {
  type CompanionClientProvider,
  getSocketHost,
  type RequestOptions,
} from '@uppy/utils'
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
    authCallbackToken,
  }: {
    authFormData: unknown
    query: Record<string, string>
    authCallbackToken?: string | undefined
  }): string {
    const searchParams = new URLSearchParams({
      ...query,
      // `origin` is only used for Companion instances configured to accept multiple origins.
      state: btoa(JSON.stringify({ origin: getOrigin() })),
      ...this.authQuery({ authFormData }),
    })

    if (this.preAuthToken) {
      searchParams.set('uppyPreAuthToken', this.preAuthToken)
    }
    if (authCallbackToken) {
      searchParams.set('authCallbackToken', authCallbackToken)
    }

    return `${this.hostname}/${this.id}/connect?${searchParams}`
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

    // Important: We need to do this synchronously, or else browsers might block the popup.
    // (We cannot wait until the websocket connection is established).
    // This opens up a race condtition if the websocket is not connected before the user
    // completes(or cancels) authentication, but that’s a small compromose we gotta make.
    const authCallbackToken = crypto.randomUUID()

    const link = this.authUrl({
      query: { uppyVersions },
      authFormData,
      authCallbackToken,
    })
    const authWindow = window.open(link, '_blank')
    let interval: number | undefined
    let webSocket: WebSocket | undefined

    try {
      const host = getSocketHost(this.opts.companionUrl)

      // Note that this promise is not guaranteed to settle in all cases
      const token = await new Promise<string>((resolve, reject) => {
        webSocket = new WebSocket(
          `${host}/api2/auth-callback/token/${authCallbackToken}`,
        )

        webSocket.addEventListener('close', () => {
          reject(new Error('Socket closed'))
        })

        webSocket.addEventListener('error', (error) => {
          this.uppy.log(
            `Companion socket error ${JSON.stringify(error)}, closing socket`,
            'warning',
          )
          webSocket?.close() // 'close' event will be emitted
        })

        webSocket.addEventListener('message', (e) => {
          try {
            const { token, error } = JSON.parse(e.data)
            if (error) {
              reject(new Error('Authentication reported error'))
            } else if (!token) {
              reject(new Error('Authentication did not return a token'))
            } else {
              resolve(token)
            }
          } catch (err) {
            reject(err)
          }
        })

        signal.addEventListener('abort', () =>
          reject(new Error('Authentication was aborted')),
        )

        // poll for user closure of the window, so we can reject when it happens
        if (authWindow) {
          interval = window.setInterval(() => {
            if (authWindow.closed) {
              reject(new Error('Auth window was closed by the user'))
            }
          }, 500)
        }
      })

      this.setAuthToken(token)
    } catch (err) {
      const message = this.uppy.i18n('authAborted')
      this.uppy.info({ message }, 'warning', 5000)
      this.uppy.log(`Authentication failed: ${err.message}`, 'warning')
      throw err
    } finally {
      // cleanup:
      // if we don't setTimeout, the window doesn't really close (I don't know why).
      setTimeout(() => authWindow?.close(), 1)
      this.uppy.log(`Closing auth callback socket ${authCallbackToken}`)
      webSocket?.close()
      clearInterval(interval)
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

  search<ResBody>(
    text: string,
    options: RequestOptions & {
      path?: string | null | undefined
      cursor?: string | undefined
    } = {},
  ): Promise<ResBody> {
    const qs = new URLSearchParams()
    qs.set('q', text)
    if (options.path) qs.set('path', options.path)
    if (options.cursor) qs.set('cursor', options.cursor)
    const base = `${this.id}/search`
    const path = `${base}?${qs.toString()}`
    return this.get<ResBody>(path, options)
  }

  async logout<ResBody>(options?: RequestOptions): Promise<ResBody> {
    const response = await this.get<ResBody>(`${this.id}/logout`, options)
    await this.removeAuthToken()
    return response
  }
}
