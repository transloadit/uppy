import Uppy = require('@uppy/core')

declare module ProgressBar {
  interface ProgressBarOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    hideAfterFinish?: boolean
    fixed?: boolean
  }
}

declare class ProgressBar extends Uppy.Plugin<ProgressBar.ProgressBarOptions> {}

export = ProgressBar
