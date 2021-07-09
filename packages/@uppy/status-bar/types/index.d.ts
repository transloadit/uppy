import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import GeneratedLocale from './generatedLocale'

declare module StatusBar {
  export type StatusBarLocale = GeneratedLocale

  export interface StatusBarOptions extends PluginOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
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

declare class StatusBar extends UIPlugin<StatusBar.StatusBarOptions> {}

export default StatusBar
