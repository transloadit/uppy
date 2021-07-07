import type { PluginOptions, UIPlugin } from '@uppy/core'

declare module ReduxDevTools {
  interface ReduxDevToolsOptions extends PluginOptions {}
}

declare class ReduxDevTools extends UIPlugin<
  ReduxDevTools.ReduxDevToolsOptions
> {}

export default ReduxDevTools
