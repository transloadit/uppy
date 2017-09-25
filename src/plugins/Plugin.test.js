const getFormData = require('get-form-data')
const nanoraf = require('nanoraf')
const yo = require('yo-yo')

const { findDOMElement } = require('../core/Utils')
const Plugin = require('./Plugin')

jest.mock('get-form-data')
jest.mock('nanoraf')
jest.mock('../core/Utils', () => ({
  findDOMElement: jest.fn()
}))

getFormData.mockImplementation(() => ({ foo: 'bar' }))
nanoraf.mockImplementation(cb => {
  cb({ some: 'state' }) // eslint-disable-line standard/no-callback-literal
  return () => {}
})

describe('Plugin', () => {
  let plugin

  afterEach(() => {
    getFormData.mockClear()
  })

  it('is a class', () => {
    expect(typeof Plugin).toBe('function')
  })

  it('accepts two parameters', () => {
    expect(Plugin.length).toBe(2)
  })

  it('defaults options when not passed as an argument', () => {
    plugin = new Plugin()
    expect(typeof plugin.opts).toBe('object')
  })

  // it('sets `replaceTargetContent` based on options argument', () => {
  //   plugin = new Plugin(null, { replaceTargetContent: false })
  //   expect(plugin.opts.replaceTargetContent).toBe(false)
  // })

  // it('defaults `replaceTargetContent` to true when not passed as an option', () => {
  //   plugin = new Plugin()
  //   expect(plugin.opts.replaceTargetContent).toBe(true)
  // })

  describe('.update', () => {
    beforeEach(() => {
      plugin = new Plugin()
      plugin.render = jest.fn(() => ({ ren: 'der' }))
    })

    it('is a function', () => {
      expect(typeof Plugin.prototype.update).toBe('function')
    })

    it('accepts one parameter', () => {
      expect(Plugin.prototype.update.length).toBe(1)
    })

    it('does nothing when plugin has no UI element (`el`)', () => {
      plugin.updateUI = jest.fn()
      expect(plugin.update()).toBe(undefined)
      expect(plugin.updateUI.mock.calls.length).toBe(0)
    })

    it('calls updateUI method with state when UI element (`el`) exists', () => {
      plugin.el = {}
      plugin.updateUI = jest.fn()
      plugin.update({ foo: 'bar' })
      expect(plugin.updateUI.mock.calls.length).toBe(1)
      expect(plugin.updateUI.mock.calls[0][0]).toEqual({ foo: 'bar' })
    })

    it('does nothing when a UI element exists but and no updateUI method', () => {
      plugin.el = {}
      expect(() => plugin.update()).not.toThrow()
    })
  })

  describe('.mount', () => {
    const addTarget = jest.fn(() => 'body')
    const mockCore = {
      iteratePlugins: (cb) => {
        cb(new mockTarget()) // eslint-disable-line new-cap
      },
      log: jest.fn(),
      setMeta: jest.fn(),
      state: 'default'
    }
    const mockPlugin = {
      id: 'pID'
    }
    const mockTarget = function () {
      this.id = 'tID'
      this.addTarget = addTarget
    }

    let yoUpdateSpy

    beforeEach(() => {
      yoUpdateSpy = jest.spyOn(yo, 'update').mockImplementation(() => ({ yo: 'el' }))
      plugin = new Plugin(mockCore, { getMetaFromForm: true })
      plugin.render = jest.fn(() => ({ ren: 'der' }))
    })

    afterEach(() => {
      findDOMElement.mockReset()
      findDOMElement.mockRestore()
      mockCore.log.mockReset()
      mockCore.setMeta.mockReset()
      yoUpdateSpy.mockReset()
      yoUpdateSpy.mockRestore()
    })

    it('is a function', () => {
      expect(typeof Plugin.prototype.mount).toBe('function')
    })

    it('accepts two parameters', () => {
      expect(Plugin.prototype.mount.length).toBe(2)
    })

    it('adds updateUI method', () => {
      plugin.mount(mockTarget, mockPlugin)
      expect(typeof plugin.updateUI).toBe('function')
    })

    it('sets `el` property when state has changed', () => {
      expect.assertions(4)

      expect(plugin.el).toBe(undefined)

      plugin.mount(mockTarget, mockPlugin)

      expect(plugin.render.mock.calls[0][0]).toEqual({ some: 'state' })
      expect(yo.update.mock.calls[0]).toEqual([undefined, { ren: 'der' }])
      expect(plugin.el).toEqual({ yo: 'el' })
    })

    describe('when target is a DOM element', () => {
      let mockElement
      const appendChild = jest.fn()

      beforeEach(() => {
        mockElement = {
          nodeName: 'FORM',
          innerHTML: 'foo',
          appendChild
        }
        mockPlugin.render = jest.fn(() => ({ el: 'lo' }))
        findDOMElement.mockImplementation(() => mockElement)
      })

      afterEach(() => {
        findDOMElement.mockReset()
        findDOMElement.mockRestore()
      })

      it('logs installation', () => {
        plugin.mount(mockTarget, mockPlugin)
        expect(mockCore.log.mock.calls.length).toBe(1)
        expect(/DOM element/.test(mockCore.log.mock.calls[0][0])).toBe(true)
      })

      it('sets form data to core\'s meta data when target is a form', () => {
        plugin.mount(mockTarget, mockPlugin)
        expect(getFormData.mock.calls[0][0]).toEqual(mockElement)
        expect(mockCore.setMeta.mock.calls[0][0]).toEqual({ foo: 'bar' })
      })

      it('does not set data to core\'s meta data when `getMetaFromForm` isn\'t a Plugin option', () => {
        plugin = new Plugin(mockCore)
        plugin.render = () => {}
        plugin.mount(mockTarget, mockPlugin)
        expect(mockCore.setMeta.mock.calls.length).toBe(0)
      })

      it('does not set data to core\'s meta data when target is not a form', () => {
        mockElement.nodeName = 'FOO'

        plugin.mount(mockTarget, mockPlugin)
        expect(mockCore.setMeta.mock.calls.length).toBe(0)
      })

      it('does not remove content from target when `replaceTargetContent` is not set', () => {
        plugin = new Plugin(mockCore)
        plugin.render = () => {}
        plugin.mount(mockTarget, mockPlugin)
        expect(mockElement.innerHTML).toBe('foo')
      })

      it('removes content from target when `replaceTargetContent` is set', () => {
        plugin = new Plugin(mockCore, {replaceTargetContent: true})
        plugin.render = () => {}
        plugin.mount(mockTarget, mockPlugin)
        expect(mockElement.innerHTML).toBe('')
      })

      it('sets `el` to plugin rendered with state', () => {
        plugin.mount(mockTarget, mockPlugin)
        expect(mockPlugin.render.mock.calls[0][0]).toBe('default')
        expect(plugin.el).toEqual({ el: 'lo' })
      })

      it('appends plugin\'s element to target', () => {
        plugin.mount(mockTarget, mockPlugin)
        expect(mockElement.appendChild.mock.calls[0][0]).toEqual({ el: 'lo' })
      })

      it('returns the target DOM element', () => {
        plugin = new Plugin(mockCore, {replaceTargetContent: true})
        plugin.render = () => {}
        const target = plugin.mount(mockTarget, mockPlugin)
        expect(target).toEqual({
          nodeName: 'FORM',
          innerHTML: '',
          appendChild
        })
      })
    })

    describe('when target is a plugin', () => {
      it('logs installation', () => {
        plugin.mount(mockTarget, mockPlugin)
        expect(mockCore.log.mock.calls.length).toBe(1)
        expect(/tID/.test(mockCore.log.mock.calls[0][0])).toBe(true)
      })

      it('adds plugin to target', () => {
        plugin.mount(mockTarget, mockPlugin)
        expect(addTarget.mock.calls[0][0]).toEqual(mockPlugin)
      })

      it('returns plugin\'s target', () => {
        const target = plugin.mount(mockTarget, mockPlugin)
        expect(target).toBe('body')
      })
    })
  })

  describe('.render', () => {
    beforeEach(() => {
      plugin = new Plugin()
    })

    it('is a function', () => {
      expect(typeof Plugin.prototype.render).toBe('function')
    })

    it('accepts one parameter', () => {
      expect(Plugin.prototype.render.length).toBe(1)
    })

    it('throws by default', () => {
      expect(() => plugin.render()).toThrow()
    })
  })

  describe('.addTarget', () => {
    beforeEach(() => {
      plugin = new Plugin()
    })

    it('is a function', () => {
      expect(typeof Plugin.prototype.addTarget).toBe('function')
    })

    it('accepts one parameter', () => {
      expect(Plugin.prototype.addTarget.length).toBe(1)
    })

    it('throws by default', () => {
      expect(() => plugin.addTarget()).toThrow()
    })
  })

  describe('.unmount', () => {
    beforeEach(() => {
      plugin = new Plugin()
    })

    it('is a function', () => {
      expect(typeof Plugin.prototype.unmount).toBe('function')
    })

    it('removes plugin\'s UI element', () => {
      const removeChild = jest.fn()
      const el = {
        parentNode: {
          removeChild
        }
      }
      plugin.el = el
      plugin.unmount()
      expect(removeChild.mock.calls.length).toBe(1)
      expect(removeChild.mock.calls[0][0]).toEqual(el)
    })

    it('does nothing when no UI element or parent', () => {
      plugin.el = {}
      expect(() => plugin.unmount()).not.toThrow()
    })
  })

  describe('.install', () => {
    it('is a function', () => {
      expect(typeof Plugin.prototype.install).toBe('function')
    })
  })

  describe('.uninstall', () => {
    it('is a function', () => {
      expect(typeof Plugin.prototype.uninstall).toBe('function')
    })

    it('calls unmount method', () => {
      const spy = jest.spyOn(Plugin.prototype, 'unmount')
      const plugin = new Plugin()
      plugin.uninstall()
      expect(spy.mock.calls.length).toBe(1)
      spy.mockReset()
      spy.mockRestore()
    })
  })
})
