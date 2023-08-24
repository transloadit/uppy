import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'

export interface ProgressBarOptions extends UIPluginOptions {
  target?: PluginTarget
  hideAfterFinish?: boolean
  fixed?: boolean
}

declare class ProgressBar extends UIPlugin<ProgressBarOptions> {}

export default ProgressBar
