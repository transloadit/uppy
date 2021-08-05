import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'

export interface ProgressBarOptions extends PluginOptions {
  target?: PluginTarget
  hideAfterFinish?: boolean
  fixed?: boolean
}

declare class ProgressBar extends UIPlugin<ProgressBarOptions> {}

export default ProgressBar
