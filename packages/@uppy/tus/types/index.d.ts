import type { PluginOptions, BasePlugin } from '@uppy/core'
import type { UploadOptions } from 'tus-js-client'

  type TusUploadOptions = Pick<UploadOptions, Exclude<keyof UploadOptions,
    | 'fingerprint'
    | 'metadata'
    | 'onProgress'
    | 'onChunkComplete'
    | 'onSuccess'
    | 'onError'
    | 'uploadUrl'
    | 'uploadSize'
  >>

export interface TusOptions extends PluginOptions, TusUploadOptions {
    metaFields?: string[] | null
    limit?: number
    useFastRemoteRetry?: boolean
    withCredentials?: boolean
  }

declare class Tus extends BasePlugin<TusOptions> {}

export default Tus
