import { isAuthError } from '../../companion-client/AuthError.js'
import { describeCompanionError } from '../../companion-client/errorCodes.js'
import type Uppy from '../../index.js'
import { ErrorWithCause, isAbortError, toError } from '../../utils/index.js'

const handleError =
  (uppy: Uppy<any, any>) =>
  (err: unknown): void => {
    // authError just means we're not authenticated, don't report it
    if (isAuthError(err)) {
      return
    }
    const error = toError(err)
    // AbortError means the user has clicked "cancel" on an operation
    if (isAbortError(error)) {
      uppy.log('Aborting request', 'warning')
      return
    }
    uppy.log(error, 'error')

    if (error.name === 'UserFacingApiError') {
      uppy.info(
        {
          message: uppy.i18n('companionError'),
          details: describeCompanionError(uppy.i18n, error),
        },
        'warning',
        5000,
      )
    } else if (error instanceof ErrorWithCause) {
      // RequestClient wraps unstructured Companion failures with their request
      // context. Show a translated fallback instead of exposing that context or
      // the upstream response body to the user.
      uppy.info(uppy.i18n('companionError'), 'warning', 5000)
    }
  }

export default handleError
