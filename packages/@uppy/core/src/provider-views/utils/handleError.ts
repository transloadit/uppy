import { localeKeyForCompanionError } from '../../companion-client/errorCodes.js'
import type Uppy from '../../index.js'

const handleError =
  (uppy: Uppy<any, any>) =>
  (error: Error): void => {
    // authError just means we're not authenticated, don't report it
    if ((error as any).isAuthError) {
      return
    }
    // AbortError means the user has clicked "cancel" on an operation
    if (error.name === 'AbortError') {
      uppy.log('Aborting request', 'warning')
      return
    }
    uppy.log(error, 'error')

    if (error.name === 'UserFacingApiError') {
      const { code } = error as { code?: string }
      const localeKey = code ? localeKeyForCompanionError(code) : undefined
      uppy.info(
        {
          message: uppy.i18n('companionError'),
          details: localeKey ? uppy.i18n(localeKey) : error.message,
        },
        'warning',
        5000,
      )
    }
  }

export default handleError
