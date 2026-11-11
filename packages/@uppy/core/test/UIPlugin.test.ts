import { h } from 'preact'
import { useLayoutEffect } from 'preact/hooks'
import { describe, expect, it, vi } from 'vitest'
import Core from '../lib/index.js'
import UIPlugin from '../lib/UIPlugin.js'

describe('UIPlugin', () => {
  it('unmounts its Preact tree when removed', () => {
    const cleanup = vi.fn()
    const target = document.createElement('div')

    function Content() {
      useLayoutEffect(() => cleanup, [])
      return h('button', null, 'Plugin content')
    }

    class Example extends UIPlugin<any, any, any> {
      override id = 'Example'
      override type = 'presenter'

      override install() {
        this.mount(target, this)
      }

      override render() {
        return h(Content, {})
      }

      override uninstall() {
        this.unmount()
      }
    }

    using core = new Core().use(Example)
    const plugin = core.getPlugin('Example')!
    expect(target.textContent).toBe('Plugin content')

    core.removePlugin(plugin)

    expect(target.childElementCount).toBe(0)
    expect(cleanup).toHaveBeenCalledOnce()
  })

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
