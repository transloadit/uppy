import type { UIPluginOptions } from '@uppy/core/lib/UIPlugin.js'

export interface StatusBarOptions extends UIPluginOptions {
  showProgressDetails?: boolean
  hideUploadButton?: boolean
  hideAfterFinish?: boolean
  hideRetryButton?: boolean
  hidePauseResumeButton?: boolean
  hideCancelButton?: boolean
  doneButtonHandler?: (() => void) | null
}
