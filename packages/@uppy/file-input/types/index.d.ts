import Uppy = require('@uppy/core')

declare module FileInput {
  export type FileInputLocale = Uppy.Locale<
    | 'chooseFiles'
  >

  export interface FileInputOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    pretty?: boolean
    inputName?: string
    locale?: FileInputLocale
  }
}

declare class FileInput extends Uppy.Plugin<FileInput.FileInputOptions> {}

export = FileInput
