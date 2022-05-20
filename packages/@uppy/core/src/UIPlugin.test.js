import { describe, expect, it } from '@jest/globals'
import UIPlugin from './UIPlugin.js'
import Core from './index.js'

describe('UIPlugin', () => {
  describe('getPluginState', () => {
    it('returns an empty object if no state is available', () => {
      class Example extends UIPlugin {}
      const inst = new Example(new Core(), {})

      expect(inst.getPluginState()).toEqual({})
    })
  })

  describe('setPluginState', () => {
    it('applies patches', () => {
      class Example extends UIPlugin {}
      const inst = new Example(new Core(), {})

      inst.setPluginState({ a: 1 })
      expect(inst.getPluginState()).toEqual({ a: 1 })
      inst.setPluginState({ b: 2 })
      expect(inst.getPluginState()).toEqual({ a: 1, b: 2 })
    })
  })
})
