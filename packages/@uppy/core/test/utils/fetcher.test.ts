import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetcher } from '../../lib/utils/fetcher.js'

describe('fetcher', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets each header once when names differ only in case', async () => {
    const setRequestHeader = vi.spyOn(
      XMLHttpRequest.prototype,
      'setRequestHeader',
    )

    await fetcher(window.location.href, {
      headers: {
        // XHR combines the values of a case-insensitive name clash, so only
        // the last of these may reach the wire.
        'Content-Type': 'text/plain',
        'content-type': 'application/pdf',
        'X-Custom': 'kept',
      },
    })

    expect(setRequestHeader.mock.calls).toEqual([
      ['content-type', 'application/pdf'],
      ['X-Custom', 'kept'],
    ])
  })

  it('sends the headers it is given when there is no clash', async () => {
    const setRequestHeader = vi.spyOn(
      XMLHttpRequest.prototype,
      'setRequestHeader',
    )

    await fetcher(window.location.href, {
      headers: { 'Content-Type': 'text/plain', 'X-Custom': 'kept' },
    })

    expect(setRequestHeader.mock.calls).toEqual([
      ['Content-Type', 'text/plain'],
      ['X-Custom', 'kept'],
    ])
  })
})
