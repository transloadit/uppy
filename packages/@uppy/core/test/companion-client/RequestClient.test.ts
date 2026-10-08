import { describe, expect, it, vi } from 'vitest'
import RequestClient from '../../lib/companion-client/RequestClient.js'
import Uppy from '../../lib/index.js'

describe('RequestClient', () => {
  it('has a hostname without trailing slash', () => {
    const mockCore = { getState: () => ({}) } as any
    const a = new RequestClient(mockCore, {
      companionUrl: 'http://companion.uppy.io',
    })
    const b = new RequestClient(mockCore, {
      companionUrl: 'http://companion.uppy.io/',
    })

    expect(a.hostname).toBe('http://companion.uppy.io')
    expect(b.hostname).toBe('http://companion.uppy.io')
  })

  it('skips host discovery as well as response hooks with skipPostResponse', async () => {
    const uppy = new Uppy()
    const client = new RequestClient(uppy, {
      companionUrl: 'http://companion.test',
    })
    const responseHook = vi.spyOn(client, 'onReceiveResponse')
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        Response.json({}, { headers: { 'i-am': 'http://discovered.test' } }),
      )
    try {
      await client.get('test', { skipPostResponse: true })
      expect(responseHook).not.toHaveBeenCalled()
      expect(client.hostname).toBe('http://companion.test')
    } finally {
      fetch.mockRestore()
      responseHook.mockRestore()
      uppy.destroy()
    }
  })
})
