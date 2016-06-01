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
    // this.name = this.constructor.name
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
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */
  getTarget (target, caller, el, render) {
    const callerPluginName = caller.id

    if (typeof target === 'string') {
      this.core.log(`Installing ${callerPluginName} to ${target}`)

      // clear everything inside the target selector
      // if (replaceTargetContent) {
      //   document.querySelector(target).innerHTML = ''
      // }
      document.querySelector(target).appendChild(el)

      return target
    } else {
      // TODO: is this the way to roll just to get the plugin name?
      const Target = target
      const targetPluginName = new Target().id
      this.core.log(`Installing ${callerPluginName} to ${targetPluginName}`)
      let targetPlugin = this.core.getPlugin(targetPluginName)
      let selectorTarget = targetPlugin.addTarget(caller, render)

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
