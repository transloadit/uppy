import yo from 'yo-yo'

/**
 * Boilerplate that all Plugins share - and should not be used
 * directly. It also shows which methods final plugins should implement/override,
 * this deciding on structure.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @return {array | string} files or success/fail message
 */
export default class Plugin {

  constructor (core, opts) {
    this.core = core
    this.opts = opts
    this.type = 'none'
    this.name = this.constructor.name
  }

  update () {
    if (typeof this.el === 'undefined') {
      return
    }

    const newEl = this.render(this.core.state)
    yo.update(this.el, newEl)
  }

  /**
   * Check if supplied `target` is a `string` or an `object`.
   * If object (that means its a plugin), search `plugins` for
   * a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */
  getTarget (target, callerPlugin, el, render) {
    if (typeof target === 'string') {
      this.core.log(`Installing ${callerPlugin.name} to ${target}`)
      document.querySelector(target).appendChild(el)

      return target
    } else {
      this.core.log(`Installing ${callerPlugin.name} to ${target.name}`)
      let targetPlugin = this.core.getPlugin(target.name)
      let selectorTarget = targetPlugin.addTarget(callerPlugin, render)

      return selectorTarget
    }
  }

  focus () {
    return
  }

  install () {
    return
  }

  run () {
    return
  }
}
