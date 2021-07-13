import type { PluginOptions, UIPlugin } from '@uppy/core'

type ReduxDevToolsOptions = PluginOptions

declare class ReduxDevTools extends UIPlugin<ReduxDevToolsOptions> {}

export default ReduxDevTools
