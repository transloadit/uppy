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

    const message = uppy.i18n('companionError')
    // Once is enough: a failed action's refresh, or each retry of a scroll,
    // would show it again while it is still up.
    if (uppy.getState().info.some((info) => info.message === message)) return

    // Only Companion's failures are shown: a `UserFacingApiError` with its
    // details, any other failed request (the request client wraps those) as
    // such. Anything else did not involve Companion (a closed auth popup, a
    // throwing `file-added` listener), so it is only logged.
    if (error.name === 'UserFacingApiError') {
      uppy.info(
        { message, details: describeCompanionError(uppy.i18n, error) },
        'warning',
        5000,
      )
    } else if (error instanceof ErrorWithCause) {
      uppy.info(message, 'warning', 5000)
    }
  }

export default handleError
