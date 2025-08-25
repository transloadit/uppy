import type { CompanionFile } from './CompanionFile.js'

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
  fetchPreAuthToken(): Promise<void>
  fileUrl: (a: string) => string
  list(
    directory: string | null,
    options: RequestOptions,
  ): Promise<{
    username: string
    nextPagePath: string | null
    items: CompanionFile[]
  }>
}
export interface CompanionClientSearchProvider {
  name: string
  provider: string
  fileUrl: (a: string) => string
  search<ResBody>(text: string, queries?: string): Promise<ResBody>
}
