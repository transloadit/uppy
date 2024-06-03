import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import FileInputLocale from './generatedLocale'

export interface FileInputOptions extends UIPluginOptions {
  target?: PluginTarget
  pretty?: boolean
  inputName?: string
  locale?: FileInputLocale
}

declare class FileInput extends UIPlugin<FileInputOptions> {}

export default FileInput
