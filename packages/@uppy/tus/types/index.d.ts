import type { PluginOptions, BasePlugin } from '@uppy/core'
import type { UploadOptions } from 'tus-js-client'

type TusUploadOptions = Pick<UploadOptions, Exclude<keyof UploadOptions,
  | 'fingerprint'
  | 'metadata'
  | 'onProgress'
  | 'onChunkComplete'
  | 'onShouldRetry'
  | 'onSuccess'
  | 'onError'
  | 'uploadUrl'
  | 'uploadSize'
>>

type Next = (err: Error | undefined, retryAttempt?: number, options?: TusOptions) => boolean

export interface TusOptions extends PluginOptions, TusUploadOptions {
    metaFields?: string[] | null
    limit?: number
    useFastRemoteRetry?: boolean
    withCredentials?: boolean
    onShouldRetry?: (err: Error | undefined, retryAttempt: number, options: TusOptions, next: Next) => boolean
  }

declare class Tus extends BasePlugin<TusOptions> {}

export default Tus
