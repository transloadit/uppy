import type { PluginOptions, UIPlugin } from '@uppy/core'

declare namespace ReduxDevTools {
  type ReduxDevToolsOptions = PluginOptions
}

declare class ReduxDevTools extends UIPlugin<
  ReduxDevTools.ReduxDevToolsOptions
> {}

export default ReduxDevTools
