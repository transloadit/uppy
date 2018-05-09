const preact = require('preact')
const { findDOMElement } = require('../core/Utils')

/**
 * Boilerplate that all Plugins share - and should not be used
 * directly. It also shows which methods final plugins should implement/override,
 * this deciding on structure.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @return {array | string} files or success/fail message
 */
module.exports = class Plugin {
  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = opts || {}

    this.update = this.update.bind(this)
    this.mount = this.mount.bind(this)
    this.install = this.install.bind(this)
    this.uninstall = this.uninstall.bind(this)
  }

  getPluginState () {
    return this.uppy.state.plugins[this.id]
  }

  setPluginState (update) {
    const plugins = Object.assign({}, this.uppy.state.plugins)
    plugins[this.id] = Object.assign({}, plugins[this.id], update)

    this.uppy.setState({
      plugins: plugins
    })
  }

  update (state) {
    if (typeof this.el === 'undefined') {
      return
    }

    if (this.updateUI) {
      this.updateUI(state)
    }
  }

  /**
   * Check if supplied `target` is a DOM element or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */
  mount (target, plugin) {
    const callerPluginName = plugin.id

    const targetElement = findDOMElement(target)

    if (targetElement) {
      this.isTargetDOMEl = true

      this.updateUI = (state) => {
        this.el = preact.render(this.render(state), this.shadow, this.el)
      }

      this.uppy.log(`Installing ${callerPluginName} to a DOM element`)

      // clear everything inside the target container
      if (this.opts.replaceTargetContent) {
        targetElement.innerHTML = ''
      }

      const wrapperEl = document.createElement('div')
      targetElement.appendChild(wrapperEl)
      this.shadow = wrapperEl.attachShadow({ mode: 'open' })
      this.el = preact.render(this.render(this.uppy.state), this.shadow)

      return this.el
    }

    let targetPlugin
    if (typeof target === 'object' && target instanceof Plugin) {
      // Targeting a plugin *instance*
      targetPlugin = target
    } else if (typeof target === 'function') {
      // Targeting a plugin type
      const Target = target
      // Find the target plugin instance.
      this.uppy.iteratePlugins((plugin) => {
        if (plugin instanceof Target) {
          targetPlugin = plugin
          return false
        }
      })
    }

    if (targetPlugin) {
      const targetPluginName = targetPlugin.id
      this.uppy.log(`Installing ${callerPluginName} to ${targetPluginName}`)
      this.el = targetPlugin.addTarget(plugin)
      return this.el
    }

    this.uppy.log(`Not installing ${callerPluginName}`)
    throw new Error(`Invalid target option given to ${callerPluginName}`)
  }

  render (state) {
    throw (new Error('Extend the render method to add your plugin to a DOM element'))
  }

  addTarget (plugin) {
    throw (new Error('Extend the addTarget method to add your plugin to another plugin\'s target'))
  }

  unmount () {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
    }
  }

  install () {

  }

  uninstall () {
    this.unmount()
  }
}
