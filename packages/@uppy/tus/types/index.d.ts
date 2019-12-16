import Uppy = require('@uppy/core')

declare module Tus {
  export interface TusOptions extends Uppy.PluginOptions {
    resume?: boolean
    removeFingerprintOnSuccess?: boolean
    endpoint?: string
    headers?: object
    chunkSize?: number
    withCredentials?: boolean
    overridePatchMethod?: boolean
    retryDelays?: number[]
    metaFields?: string[] | null
    autoRetry?: boolean
    limit?: number
  }
}

declare class Tus extends Uppy.Plugin<Tus.TusOptions> {}

export = Tus
