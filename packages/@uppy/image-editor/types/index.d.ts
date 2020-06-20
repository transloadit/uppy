import Uppy = require('@uppy/core')
import FileInputLocale = require('./generatedLocale')

declare module FileInput {
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
