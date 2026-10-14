import { isAuthError } from '../../companion-client/AuthError.js'
import { describeCompanionError } from '../../companion-client/errorCodes.js'
import type Uppy from '../../index.js'
import { isAbortError, toError } from '../../utils/index.js'

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

    // Local file-selection / addFiles failures already report their own errors;
    // do not relabel them as Companion connection failures.
    if (
      (typeof AggregateError === 'function' &&
        error instanceof AggregateError) ||
      ('errors' in error && Array.isArray((error as any).errors)) ||
      (error as any).isRestriction
    ) {
      return
    }

    if (error.name === 'UserFacingApiError') {
      uppy.info(
        {
          message: uppy.i18n('companionError'),
          details: describeCompanionError(uppy.i18n, error),
        },
        'warning',
        5000,
      )
      return
    }

    // Connection failure without a structured error: show exactly one sanitized, translated warning
    uppy.info(uppy.i18n('companionError'), 'warning', 5000)
  }

export default handleError
