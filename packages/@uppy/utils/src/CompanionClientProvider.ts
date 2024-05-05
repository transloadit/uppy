export type RequestOptions = {
  method?: string
  data?: Record<string, unknown>
  skipPostResponse?: boolean
  signal?: AbortSignal
  authFormData?: unknown
  qs?: Record<string, string>
}

/**
 * CompanionClientProvider is subset of the types of the `Provider`
 * class from @uppy/companion-client.
 *
 * This is needed as the `Provider` class is passed around in Uppy and we
 * need to have shared types for it. Although we are duplicating some types,
 * this is still safe as `Provider implements CompanionClientProvider`
 * so any changes here will error there and vice versa.
 *
 * TODO: remove this once companion-client and provider-views are merged into a single plugin.
 */
export interface CompanionClientProvider {
  name: string
  provider: string
  login(options?: RequestOptions): Promise<void>
  logout<ResBody>(options?: RequestOptions): Promise<ResBody>
  list<ResBody>(
    directory: string | undefined,
    options: RequestOptions,
  ): Promise<ResBody>
}
export interface CompanionClientSearchProvider {
  name: string
  provider: string
  search<ResBody>(text: string, queries?: string): Promise<ResBody>
}
