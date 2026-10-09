import { describe, expect, it, vi } from 'vitest'
import AuthError from '../../../lib/companion-client/AuthError.js'
import handleError from '../../../lib/provider-views/utils/handleError.js'
import ErrorWithCause from '../../../lib/utils/ErrorWithCause.js'

function createUppy() {
  return {
    i18n: vi.fn((key: string) => `translated:${key}`),
    info: vi.fn(),
    log: vi.fn(),
  } as any
}

describe('handleError', () => {
  it('shows one safe Companion warning for wrapped request failures', () => {
    const uppy = createUppy()
    const privateError = new ErrorWithCause(
      'Could not GET a private endpoint',
      {
        cause: new Error('private-diagnostic-sentinel'),
      },
    )

    handleError(uppy)(privateError)

    expect(uppy.info).toHaveBeenCalledTimes(1)
    expect(uppy.info).toHaveBeenCalledWith(
      'translated:companionError',
      'warning',
      5000,
    )
    expect(uppy.info.mock.calls.flat().join(' ')).not.toContain(
      'private-diagnostic-sentinel',
    )
  })

  it('keeps non-request errors out of the Companion warning path', () => {
    const uppy = createUppy()

    handleError(uppy)(new Error('local file-selection failure'))

    expect(uppy.info).not.toHaveBeenCalled()
  })

  it('keeps authentication probes and expected cancellation silent', () => {
    const uppy = createUppy()

    handleError(uppy)(new AuthError())
    handleError(uppy)(
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
    )

    expect(uppy.info).not.toHaveBeenCalled()
  })

  it('preserves structured Companion error details', () => {
    const uppy = createUppy()
    const error = Object.assign(new Error('provider detail'), {
      name: 'UserFacingApiError',
      code: 'PROVIDER_ERROR',
    })

    handleError(uppy)(error)

    expect(uppy.info).toHaveBeenCalledTimes(1)
    expect(uppy.info).toHaveBeenCalledWith(
      {
        message: 'translated:companionError',
        details: 'provider detail',
      },
      'warning',
      5000,
    )
  })
})
