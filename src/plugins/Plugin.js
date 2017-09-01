const yo = require('yo-yo')
const nanoraf = require('nanoraf')
const { findDOMElement } = require('../core/Utils')
const getFormData = require('get-form-data')

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

  constructor (core, opts) {
    this.core = core
    this.opts = opts || {}

    // clear everything inside the target selector
    this.opts.replaceTargetContent === this.opts.replaceTargetContent || true

    this.update = this.update.bind(this)
    this.mount = this.mount.bind(this)
    this.install = this.install.bind(this)
    this.uninstall = this.uninstall.bind(this)
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

    // Set up nanoraf.
    this.updateUI = nanoraf((state) => {
      this.el = yo.update(this.el, this.render(state))
    })

    if (targetElement) {
      this.core.log(`Installing ${callerPluginName} to a DOM element`)

      // attempt to extract meta from form element
      if (this.opts.getMetaFromForm && targetElement.nodeName === 'FORM') {
        const formMeta = getFormData(targetElement)
        this.core.setMeta(formMeta)
      }

      // clear everything inside the target container
      if (this.opts.replaceTargetContent) {
        targetElement.innerHTML = ''
      }

      this.el = plugin.render(this.core.state)
      targetElement.appendChild(this.el)

      return targetElement
    } else {
      // TODO: is instantiating the plugin really the way to roll
      // just to get the plugin name?
      const Target = target
      const targetPluginName = new Target().id

      this.core.log(`Installing ${callerPluginName} to ${targetPluginName}`)

      const targetPlugin = this.core.getPlugin(targetPluginName)
      const selectorTarget = targetPlugin.addTarget(plugin)

      return selectorTarget
    }
  }

  unmount () {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
    }
  }

  install () {
    return
  }

  uninstall () {
    this.unmount()
  }
}
