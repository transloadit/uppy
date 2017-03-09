const yo = require('yo-yo')
// const nanoraf = require('nanoraf')

/**
 * Check if an object is a DOM element. Duck-typing based on `nodeType`.
 *
 * @param {*} obj
 */
function isDOMElement (obj) {
  return obj && typeof obj === 'object' && obj.nodeType === Node.ELEMENT_NODE
}

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
    this.type = 'none'

    // clear everything inside the target selector
    this.opts.replaceTargetContent === this.opts.replaceTargetContent || true

    this.update = this.update.bind(this)
    this.mount = this.mount.bind(this)
    this.focus = this.focus.bind(this)
    this.install = this.install.bind(this)

    // this.frame = null
  }

  update (state) {
    if (typeof this.el === 'undefined') {
      return
    }

    // const prev = {}
    // if (!this.frame) {
    //   console.log('creating frame')
    //   this.frame = nanoraf((state, prev) => {
    //     console.log('updating!', Date.now())
    //     const newEl = this.render(state)
    //     this.el = yo.update(this.el, newEl)
    //   })
    // }
    // console.log('attempting an update...', Date.now())
    // this.frame(state, prev)

    // this.core.log('update number: ' + this.core.updateNum++)

    const newEl = this.render(state)
    yo.update(this.el, newEl)

    // optimizes performance?
    // requestAnimationFrame(() => {
    //   const newEl = this.render(state)
    //   yo.update(this.el, newEl)
    // })
  }

  /**
   * Check if supplied `target` is a `string` or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */
  mount (target, plugin) {
    const callerPluginName = plugin.id

    let targetElement
    if (isDOMElement(target)) {
      this.core.log(`Installing ${callerPluginName} to a DOM element`)
      targetElement = target
    } else if (typeof target === 'string') {
      this.core.log(`Installing ${callerPluginName} to ${target}`)
      targetElement = document.querySelector(target)
    }

    if (targetElement) {
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

  focus () {
    return
  }

  install () {
    return
  }
}
