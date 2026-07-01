import { describe, expect, it } from 'vitest'
import RequestClient from './RequestClient.js'

describe('RequestClient', () => {
  it('has a hostname without trailing slash', () => {
    const mockCore = { getState: () => ({}) } as any
    const a = new RequestClient(mockCore, {
      pluginId: 'test',
      provider: 'test',
      companionUrl: 'http://companion.uppy.io',
    })
    const b = new RequestClient(mockCore, {
      pluginId: 'test2',
      provider: 'test2',
      companionUrl: 'http://companion.uppy.io/',
    })

    expect(a.hostname).toBe('http://companion.uppy.io')
    expect(b.hostname).toBe('http://companion.uppy.io')
  })
})
