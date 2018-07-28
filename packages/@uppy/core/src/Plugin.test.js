const Plugin = require('./Plugin')
const Core = require('./index')

describe('Plugin', () => {
  describe('getPluginState', () => {
    it('returns an empty object if no state is available', () => {
      class Example extends Plugin {}
      const inst = new Example(new Core(), {})

      expect(inst.getPluginState()).toEqual({})
    })
  })

  describe('setPluginState', () => {
    it('applies patches', () => {
      class Example extends Plugin {}
      const inst = new Example(new Core(), {})

      inst.setPluginState({ a: 1 })
      expect(inst.getPluginState()).toEqual({ a: 1 })
      inst.setPluginState({ b: 2 })
      expect(inst.getPluginState()).toEqual({ a: 1, b: 2 })
    })
  })
})
