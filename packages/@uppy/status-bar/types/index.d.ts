import Uppy = require('@uppy/core')
import GeneratedLocale = require('./generatedLocale')

declare module StatusBar {
  export type StatusBarLocale = GeneratedLocale

  export interface StatusBarOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    showProgressDetails?: boolean
    hideUploadButton?: boolean
    hideAfterFinish?: boolean
    hideRetryButton?: boolean,
    hidePauseResumeButton?: boolean,
    hideCancelButton?: boolean,
    doneButtonHandler?: () => void,
    locale?: StatusBarLocale
  }
}

declare class StatusBar extends Uppy.Plugin<StatusBar.StatusBarOptions> {}

export = StatusBar
