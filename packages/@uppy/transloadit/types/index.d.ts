import type { PluginOptions, UppyFile, BasePlugin } from '@uppy/core'
import TransloaditLocale from './generatedLocale'

declare module Transloadit {
  interface AssemblyParameters {
    auth: {
      key: string,
      expires?: string
    }
    template_id?: string
    steps?: { [step: string]: object }
    notify_url?: string
    fields?: { [name: string]: number | string }
  }

  interface AssemblyOptions {
    params: AssemblyParameters
    fields?: { [name: string]: number | string }
    signature?: string
  }

  interface TransloaditOptionsBase extends PluginOptions {
    service?: string
    errorReporting?: boolean
    waitForEncoding?: boolean
    waitForMetadata?: boolean
    importFromUploadURLs?: boolean
    alwaysRunAssembly?: boolean
    locale?: TransloaditLocale
    limit?: number
  }

  // Either have a getAssemblyOptions() that returns an AssemblyOptions, *or* have them embedded in the options
  type TransloaditOptions = TransloaditOptionsBase &
    (
      | {
          getAssemblyOptions?: (file: UppyFile) => AssemblyOptions | Promise<AssemblyOptions>
        }
      | AssemblyOptions)
}

declare class Transloadit extends BasePlugin<Transloadit.TransloaditOptions> {
  static COMPANION: string
  static COMPANION_PATTERN: RegExp
}

export default Transloadit
