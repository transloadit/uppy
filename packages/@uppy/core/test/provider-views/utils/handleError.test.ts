import { describe, expect, it } from 'vitest'
import AuthError from '../../../lib/companion-client/AuthError.js'
import Core from '../../../lib/index.js'
import handleError from '../../../lib/provider-views/utils/handleError.js'
import { ErrorWithCause, UserFacingApiError } from '../../../lib/utils/index.js'

const shown = (err: unknown) => {
  const uppy = new Core()
  handleError(uppy)(err)
  return uppy.getState().info.map(({ message, details }) => ({
    message,
    details,
  }))
}

describe('handleError()', () => {
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

  it('only logs an error that did not involve Companion', () => {
    expect(shown(new Error('a `file-added` listener threw'))).toEqual([])
  })

  it('shows nothing for a cancel or a missing login', () => {
    expect(shown(new DOMException('Aborted', 'AbortError'))).toEqual([])
    expect(shown(new AuthError())).toEqual([])
  })
})
