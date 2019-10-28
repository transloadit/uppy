import Uppy = require('@uppy/core')

declare module ProgressBar {
  interface ProgressBarOptions extends Uppy.PluginOptions {
    hideAfterFinish?: boolean
    fixed?: boolean
  }
}

declare class ProgressBar extends Uppy.Plugin<ProgressBar.ProgressBarOptions> {}

export = ProgressBar
