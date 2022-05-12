const RequestClient = require('./RequestClient')

describe('RequestClient', () => {
  it('has a hostname without trailing slash', () => {
    const mockCore = { getState: () => ({}) }
    const a = new RequestClient(mockCore, { companionUrl: 'http://companion.uppy.io' })
    const b = new RequestClient(mockCore, { companionUrl: 'http://companion.uppy.io/' })

    expect(a.hostname).toBe('http://companion.uppy.io')
    expect(b.hostname).toBe('http://companion.uppy.io')
  })
})
