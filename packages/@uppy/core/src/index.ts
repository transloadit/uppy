export { default } from './Uppy.js'
export {
  default as Uppy,
  type State,
  type BaseProviderPlugin,
  type PartialTree,
  type PartialTreeFile,
  type PartialTreeFolder,
  type PartialTreeFolderNode,
  type PartialTreeFolderRoot,
  type PartialTreeId,
  type UnknownPlugin,
  type UnknownProviderPlugin,
  type UnknownProviderPluginState,
  type UnknownSearchProviderPlugin,
  type UnknownSearchProviderPluginState,
  type UploadResult,
  type UppyEventMap,
  type UppyOptions,
  type AsyncStore,
} from './Uppy.js'

export { default as UIPlugin } from './UIPlugin.js'
export type { UIPluginOptions } from './UIPlugin.js'

export { default as BasePlugin } from './BasePlugin.js'
export type { DefinePluginOpts, PluginOpts } from './BasePlugin.js'

export { debugLogger } from './loggers.js'

export type { Store } from '@uppy/store-default'

export type {
  UppyFile,
  MinimalRequiredUppyFile,
  Meta,
  Body,
} from '@uppy/utils/lib/UppyFile'
