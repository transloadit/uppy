import Uppy = require('@uppy/core')

declare module Tus {
  export interface TusOptions extends Uppy.PluginOptions {
    limit?: number
    endpoint: string
    uploadUrl?: string
    useFastRemoteRetry?: boolean
    resume?: boolean
    autoRetry?: boolean
  }
}

declare class Tus extends Uppy.Plugin<Tus.TusOptions> {}

export = Tus
