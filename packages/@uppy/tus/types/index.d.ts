import Uppy = require('@uppy/core')
import { UploadOptions } from 'tus-js-client'

declare module Tus {
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

  export interface TusOptions extends Uppy.PluginOptions, TusUploadOptions {
    metaFields?: string[] | null
    autoRetry?: boolean
    limit?: number
    useFastRemoteRetry?: boolean
    withCredentials?: boolean
  }
}

declare class Tus extends Uppy.Plugin<Tus.TusOptions> {}

export = Tus
