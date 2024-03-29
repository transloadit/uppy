import type { UIPluginOptions } from '@uppy/core/lib/UIPlugin'
import type StatusBarLocale from './locale.ts'

export interface StatusBarOptions extends UIPluginOptions {
  showProgressDetails?: boolean
  hideUploadButton?: boolean
  hideAfterFinish?: boolean
  hideRetryButton?: boolean
  hidePauseResumeButton?: boolean
  hideCancelButton?: boolean
  doneButtonHandler?: (() => void) | null
  locale?: typeof StatusBarLocale
}
