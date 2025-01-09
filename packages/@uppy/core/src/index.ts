export { default, default as Uppy } from './Uppy.js'
export type {
  State,
  BaseProviderPlugin,
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeFolderRoot,
  PartialTreeId,
  UnknownPlugin,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  UnknownSearchProviderPlugin,
  UnknownSearchProviderPluginState,
  UploadResult,
  UppyEventMap,
  UppyOptions,
  AsyncStore,
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
