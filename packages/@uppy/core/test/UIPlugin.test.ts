import { describe, expect, it } from 'vitest'
import Core from '../lib/index.js'
import UIPlugin from '../lib/UIPlugin.js'

describe('UIPlugin', () => {
  describe('getPluginState', () => {
    it('returns an empty object if no state is available', () => {
      class Example extends UIPlugin<any, any, any> {}
      const inst = new Example(new Core<any, any>(), {})

      expect(inst.getPluginState()).toEqual({})
    })
  })

  describe('setPluginState', () => {
    it('applies patches', () => {
      class Example extends UIPlugin<any, any, any> {}
      const inst = new Example(new Core(), {})

      inst.setPluginState({ a: 1 })
      expect(inst.getPluginState()).toEqual({ a: 1 })
      inst.setPluginState({ b: 2 })
      expect(inst.getPluginState()).toEqual({ a: 1, b: 2 })
    })
  })
})
