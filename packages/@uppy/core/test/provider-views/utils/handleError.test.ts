import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuthError from '../../../lib/companion-client/AuthError.js'
import Core from '../../../lib/index.js'
import handleError from '../../../lib/provider-views/utils/handleError.js'
import { ErrorWithCause, UserFacingApiError } from '../../../lib/utils/index.js'

const silent = { debug() {}, warn() {}, error() {} }

const shown = (...errors: unknown[]) => {
  const uppy = new Core({ logger: silent })
  errors.forEach(handleError(uppy))
  const { info } = uppy.getState()
  uppy.destroy()
  return info.map(({ message, details }) => ({ message, details }))
}

describe('handleError()', () => {
  // `info()` hides each message on a timer: fake ones are dropped afterwards
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a UserFacingApiError with its message as details', () => {
    expect(shown(new UserFacingApiError('Quota exceeded'))).toEqual([
      {
        message: 'Connection with Companion failed',
        details: 'Quota exceeded',
      },
    ])
  })

  it('shows any other failed Companion request, without its URL', () => {
    const err = new ErrorWithCause('Could not GET http://companion.test/x', {
      cause: new Error('Request failed with status 500'),
    })
    expect(shown(err)).toEqual([
      { message: 'Connection with Companion failed', details: null },
    ])
  })

  it('shows a failure once while it is still up', () => {
    const err = new ErrorWithCause('Could not GET http://companion.test/x')
    expect(shown(err, err)).toEqual([
      { message: 'Connection with Companion failed', details: null },
    ])
  })

  it('still shows a user-facing error while a generic failure is up', () => {
    expect(
      shown(
        new ErrorWithCause('Could not GET http://companion.test/x'),
        new UserFacingApiError('Quota exceeded'),
      ),
    ).toEqual([
      { message: 'Connection with Companion failed', details: null },
      {
        message: 'Connection with Companion failed',
        details: 'Quota exceeded',
      },
    ])
  })

  it('only logs an error that did not involve Companion', () => {
    expect(shown(new Error('a `file-added` listener threw'))).toEqual([])
  })

  it('shows nothing for a cancel or a missing login', () => {
    expect(shown(new DOMException('Aborted', 'AbortError'))).toEqual([])
    expect(shown(new AuthError())).toEqual([])
  })
})
