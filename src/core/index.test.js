import Core from './index'

describe('core/index', () => {
  it('should expose the uppy core as the default export', () => {
    expect(typeof Core).toEqual('function')
    const core = new Core({})
    expect(typeof core).toEqual('object')
    expect(core.constructor.name).toEqual('Uppy')
  })
})
