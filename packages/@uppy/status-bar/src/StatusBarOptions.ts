import type { UIPluginOptions } from '@uppy/core/lib/UIPlugin.js'
import type StatusBarLocale from './locale.js'
import type { LocaleStrings } from '@uppy/utils/lib/Translator'

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
