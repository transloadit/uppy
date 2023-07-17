import type { UIPlugin, UIPluginOptions } from '@uppy/core'

type ReduxDevToolsOptions = UIPluginOptions

declare class ReduxDevTools extends UIPlugin<ReduxDevToolsOptions> {}

export default ReduxDevTools
