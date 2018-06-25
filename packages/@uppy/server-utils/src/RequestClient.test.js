const RequestClient = require('./RequestClient')

describe('RequestClient', () => {
  it('has a hostname without trailing slash', () => {
    const mockCore = { getState: () => ({}) }
    const a = new RequestClient(mockCore, { serverUrl: 'http://server.uppy.io' })
    const b = new RequestClient(mockCore, { serverUrl: 'http://server.uppy.io/' })

    expect(a.hostname).toBe('http://server.uppy.io')
    expect(b.hostname).toBe('http://server.uppy.io')
  })
})
