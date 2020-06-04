const preact = require('preact')
const findDOMElement = require('@uppy/utils/lib/findDOMElement')

/**
 * Defer a frequent call to the microtask queue.
 */
function debounce (fn) {
  let calling = null
  let latestArgs = null
  return (...args) => {
    latestArgs = args
    if (!calling) {
      calling = Promise.resolve().then(() => {
        calling = null
        // At this point `args` may be different from the most
        // recent state, if multiple calls happened since this task
        // was queued. So we use the `latestArgs`, which definitely
        // is the most recent call.
        return fn(...latestArgs)
      })
    }
    return calling
  }
}

/**
 * Boilerplate that all Plugins share - and should not be used
 * directly. It also shows which methods final plugins should implement/override,
 * this deciding on structure.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @returns {Array|string} files or success/fail message
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
    const { plugins } = this.uppy.getState()
    return plugins[this.id] || {}
  }

  setPluginState (update) {
    const { plugins } = this.uppy.getState()

    this.uppy.setState({
      plugins: {
        ...plugins,
        [this.id]: {
          ...plugins[this.id],
          ...update
        }
      }
    })
  }

  setOptions (newOpts) {
    this.opts = { ...this.opts, ...newOpts }
    this.setPluginState() // so that UI re-renders with new options
  }

  update (state) {
    if (typeof this.el === 'undefined') {
      return
    }

    if (this._updateUI) {
      this._updateUI(state)
    }
  }

  // Called after every state update, after everything's mounted. Debounced.
  afterUpdate () {

  }

  /**
   * Called when plugin is mounted, whether in DOM or into another plugin.
   * Needed because sometimes plugins are mounted separately/after `install`,
   * so this.el and this.parent might not be available in `install`.
   * This is the case with @uppy/react plugins, for example.
   */
  onMount () {

  }

  /**
   * Check if supplied `target` is a DOM element or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   *
   * @param {string|object} target
   *
   */
  mount (target, plugin) {
    const callerPluginName = plugin.id

    const targetElement = findDOMElement(target)

    if (targetElement) {
      this.isTargetDOMEl = true

      // API for plugins that require a synchronous rerender.
      this.rerender = (state) => {
        // plugin could be removed, but this.rerender is debounced below,
        // so it could still be called even after uppy.removePlugin or uppy.close
        // hence the check
        if (!this.uppy.getPlugin(this.id)) return
        this.el = preact.render(this.render(state), targetElement, this.el)
        this.afterUpdate()
      }
      this._updateUI = debounce(this.rerender)

      this.uppy.log(`Installing ${callerPluginName} to a DOM element '${target}'`)

      // clear everything inside the target container
      if (this.opts.replaceTargetContent) {
        targetElement.innerHTML = ''
      }

      this.el = preact.render(this.render(this.uppy.getState()), targetElement)

      this.onMount()
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
      this.uppy.log(`Installing ${callerPluginName} to ${targetPlugin.id}`)
      this.parent = targetPlugin
      this.el = targetPlugin.addTarget(plugin)

      this.onMount()
      return this.el
    }

    this.uppy.log(`Not installing ${callerPluginName}`)

    let message = `Invalid target option given to ${callerPluginName}.`
    if (typeof target === 'function') {
      message += ' The given target is not a Plugin class. ' +
        'Please check that you\'re not specifying a React Component instead of a plugin. ' +
        'If you are using @uppy/* packages directly, make sure you have only 1 version of @uppy/core installed: ' +
        'run `npm ls @uppy/core` on the command line and verify that all the versions match and are deduped correctly.'
    } else {
      message += 'If you meant to target an HTML element, please make sure that the element exists. ' +
        'Check that the <script> tag initializing Uppy is right before the closing </body> tag at the end of the page. ' +
        '(see https://github.com/transloadit/uppy/issues/1042)\n\n' +
        'If you meant to target a plugin, please confirm that your `import` statements or `require` calls are correct.'
    }
    throw new Error(message)
  }

  render (state) {
    throw (new Error('Extend the render method to add your plugin to a DOM element'))
  }

  addTarget (plugin) {
    throw (new Error('Extend the addTarget method to add your plugin to another plugin\'s target'))
  }

  unmount () {
    if (this.isTargetDOMEl && this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
    }
  }

  install () {

  }

  uninstall () {
    this.unmount()
  }
}
