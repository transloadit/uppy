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

  it('never includes nested request URLs or response bodies in user feedback', () => {
    const uppy = createUppy()
    const error = new ErrorWithCause('Failed POST https://private.example/token', {
      cause: new Error('upstream-body-with-secret'),
    })

    handleError(uppy)(error)

    expect(uppy.info).toHaveBeenCalledExactlyOnceWith(
      'translated:companionError',
      'warning',
      5000,
    )
    const notices = JSON.stringify(uppy.info.mock.calls)
    expect(notices).not.toContain('private.example')
    expect(notices).not.toContain('upstream-body-with-secret')
  })

  it('reports one warning per separate failed connection attempt', () => {
    const uppy = createUppy()
    const report = handleError(uppy)

    report(new ErrorWithCause('request failed', { cause: new Error('first') }))
    expect(uppy.info).toHaveBeenCalledTimes(1)
    report(new ErrorWithCause('request failed', { cause: new Error('second') }))

    expect(uppy.info).toHaveBeenCalledTimes(2)
    expect(uppy.info.mock.calls).toEqual([
      ['translated:companionError', 'warning', 5000],
      ['translated:companionError', 'warning', 5000],
    ])
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
