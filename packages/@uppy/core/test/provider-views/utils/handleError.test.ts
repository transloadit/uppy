import { describe, expect, it, vi } from 'vitest'
import AuthError from '../../../src/companion-client/AuthError.js'
import Uppy, { UserFacingApiError } from '../../../src/index.js'
import handleError from '../../../src/provider-views/utils/handleError.js'
import ErrorWithCause from '../../../src/utils/ErrorWithCause.js'

describe('handleError', () => {
  it('silently ignores AuthError (unauthenticated session probes)', () => {
    const uppy = new Uppy()
    const logSpy = vi.spyOn(uppy, 'log')
    const infoSpy = vi.spyOn(uppy, 'info')

    handleError(uppy)(new AuthError())

    expect(infoSpy).not.toHaveBeenCalled()
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('silently ignores AbortError while logging a warning', () => {
    const uppy = new Uppy()
    const logSpy = vi.spyOn(uppy, 'log')
    const infoSpy = vi.spyOn(uppy, 'info')

    const abortError = new DOMException(
      'The operation was aborted',
      'AbortError',
    )
    handleError(uppy)(abortError)

    expect(infoSpy).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('Aborting request', 'warning')
  })

  it('silently ignores AggregateError / local file check errors from addFiles', () => {
    const uppy = new Uppy()
    const infoSpy = vi.spyOn(uppy, 'info')

    const aggErr = new AggregateError(
      [new Error('file exists')],
      'Multiple errors',
    )
    handleError(uppy)(aggErr)

    expect(infoSpy).not.toHaveBeenCalled()

    const restrictionErr = Object.assign(new Error('Restriction error'), {
      isRestriction: true,
    })
    handleError(uppy)(restrictionErr)

    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('translates structured UserFacingApiError codes', () => {
    const uppy = new Uppy()
    const infoSpy = vi.spyOn(uppy, 'info')

    const error = new UserFacingApiError(
      'folder error',
      'S3_FOLDER_INTO_ITSELF',
    )
    handleError(uppy)(error)

    expect(infoSpy).toHaveBeenCalledWith(
      {
        message: 'Connection with Companion failed',
        details: 'A folder cannot be moved into itself',
      },
      'warning',
      5000,
    )
  })

  it('emits sanitized companionError warning for rejected getGrant() without leaking details', () => {
    const uppy = new Uppy()
    const infoSpy = vi.spyOn(uppy, 'info')

    const error = new Error('private-diagnostic-sentinel')
    handleError(uppy)(error)

    expect(infoSpy).toHaveBeenCalledWith(
      'Connection with Companion failed',
      'warning',
      5000,
    )
    expect(infoSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.stringContaining('private-diagnostic-sentinel'),
      }),
      expect.anything(),
      expect.anything(),
    )
  })

  it('emits sanitized companionError warning for fetch rejections without leaking details', () => {
    const uppy = new Uppy()
    const infoSpy = vi.spyOn(uppy, 'info')

    const networkErr = new ErrorWithCause(
      'Could not GET https://internal-companion.corp/s3/list',
      {
        cause: new TypeError('Failed to fetch'),
      },
    )
    handleError(uppy)(networkErr)

    expect(infoSpy).toHaveBeenCalledWith(
      'Connection with Companion failed',
      'warning',
      5000,
    )
  })

  it('emits sanitized companionError warning for plain-text 503 HTTP responses', () => {
    const uppy = new Uppy()
    const infoSpy = vi.spyOn(uppy, 'info')

    const httpErr = new ErrorWithCause(
      'Could not POST http://companion/s3/simple-auth',
      {
        cause: new Error(
          'Failed request with status: 503. Service Unavailable',
        ),
      },
    )
    handleError(uppy)(httpErr)

    expect(infoSpy).toHaveBeenCalledWith(
      'Connection with Companion failed',
      'warning',
      5000,
    )
  })
})
