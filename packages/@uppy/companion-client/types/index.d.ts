import type { Uppy } from '@uppy/core'

/**
 * Async storage interface, similar to `localStorage`. This can be used to
 * implement custom storages for authentication tokens.
 */
export interface TokenStorage {
  setItem: (key: string, value: string) => Promise<void>
  getItem: (key: string) => Promise<string>
  removeItem: (key: string) => Promise<void>
}

export interface RequestClientOptions {
  companionUrl: string
  companionHeaders?: Record<string, unknown>
  companionCookiesRule?: RequestCredentials
}

export class RequestClient {
  constructor (uppy: Uppy, opts: RequestClientOptions)

  get (path: string): Promise<any>

  post (path: string, data: Record<string, unknown>): Promise<any>

  delete (path: string, data: Record<string, unknown>): Promise<any>
}

/**
 * Options for Providers that can be passed in by Uppy users through
 * Plugin constructors.
 */
export interface PublicProviderOptions extends RequestClientOptions {
  companionAllowedHosts?: string | RegExp | Array<string | RegExp>
}

/**
 * Options for Providers, including internal options that Plugins can set.
 */
export interface ProviderOptions extends PublicProviderOptions {
  provider: string
  name?: string
  pluginId: string
}

export class Provider extends RequestClient {
  constructor (uppy: Uppy, opts: ProviderOptions)

  checkAuth (): Promise<boolean>

  authUrl (): string

  fileUrl (id: string): string

  list (directory: string): Promise<any>

  logout (redirect?: string): Promise<any>

  static initPlugin (plugin: unknown, opts: Record<string, unknown>, defaultOpts?: Record<string, unknown>): void
}

export interface SocketOptions {
  target: string
  autoOpen?: boolean
}

export class Socket {
  readonly isOpen: boolean

  constructor (opts: SocketOptions)

  open (): void

  close (): void

  send (action: string, payload: unknown): void

  on (action: string, handler: (param: any) => void): void

  once (action: string, handler: (param: any) => void): void

  emit (action: string, payload: (param: any) => void): void
}
