import Uppy = require('@uppy/core')

declare module ReduxDevTools {
  interface ReduxDevToolsOptions extends Uppy.PluginOptions {}
}

declare class ReduxDevTools extends Uppy.Plugin<
  ReduxDevTools.ReduxDevToolsOptions
> {}

export = ReduxDevTools
