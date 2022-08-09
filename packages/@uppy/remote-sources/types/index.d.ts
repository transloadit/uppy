import type { PluginOptions, BasePlugin, PluginTarget } from '@uppy/core'
import type { RequestClientOptions } from '@uppy/companion-client'

interface RemoteTargetOptions extends PluginOptions, RequestClientOptions {
  target?: PluginTarget
  sources?: Array<string>
  title?: string
  companionUrl: string
}

declare class RemoteTarget extends BasePlugin<RemoteTargetOptions> {}

export default RemoteTarget
