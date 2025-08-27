import type { UIPluginOptions } from '@uppy/core'
import type { LocaleStrings } from '@uppy/utils'
import type StatusBarLocale from './locale.js'

export interface StatusBarOptions extends UIPluginOptions {
  showProgressDetails?: boolean
  hideUploadButton?: boolean
  hideAfterFinish?: boolean
  hideRetryButton?: boolean
  hidePauseResumeButton?: boolean
  hideCancelButton?: boolean
  doneButtonHandler?: (() => void) | null
  locale?: LocaleStrings<typeof StatusBarLocale>
}
