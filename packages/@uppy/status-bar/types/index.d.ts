import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import GeneratedLocale from './generatedLocale'

export type StatusBarLocale = GeneratedLocale

export interface StatusBarOptions extends PluginOptions {
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

declare class StatusBar extends UIPlugin<StatusBarOptions> {}

export default StatusBar
