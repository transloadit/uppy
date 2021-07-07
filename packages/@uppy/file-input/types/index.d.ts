import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import FileInputLocale from './generatedLocale'

declare module FileInput {
  export interface FileInputOptions extends PluginOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    pretty?: boolean
    inputName?: string
    locale?: FileInputLocale
  }
}

declare class FileInput extends UIPlugin<FileInput.FileInputOptions> {}

export default FileInput
