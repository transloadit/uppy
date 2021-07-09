import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'

declare module ProgressBar {
  interface ProgressBarOptions extends PluginOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    hideAfterFinish?: boolean
    fixed?: boolean
  }
}

declare class ProgressBar extends UIPlugin<ProgressBar.ProgressBarOptions> {}

export default ProgressBar
