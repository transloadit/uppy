const { render, h, createRef, cloneElement } = require('preact')
const findDOMElement = require('@uppy/utils/lib/findDOMElement')

const BasePlugin = require('./BasePlugin')

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
 * Plugin is the extended version of BasePlugin to incorporate rendering with Preact.
 * Use this for plugins that need a user interface.
 *
 * For plugins without an user interface, see BasePlugin.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @returns {Array|string} files or success/fail message
 */
module.exports = class Plugin extends BasePlugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.mount = this.mount.bind(this)
  }

  /**
   * Check if supplied `target` is a DOM element or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
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
        render(this.render(state), targetElement)
        this.afterUpdate()
      }

      this.updateUI = debounce(this.rerender)

      this.uppy.log(`Installing ${callerPluginName} to a DOM element '${target}'`)

      if (this.opts.replaceTargetContent) {
        // Although you could remove the child nodes using DOM APIs (container.innerHTML = ''),
        // this isn't recommended because the component might need to do additional cleanup when it is removed.
        // To remove the rendered content and run any cleanup processes, render an empty element into the container:
        render(h(null), targetElement)
      }

      // Since preact X the render function does not return a reference to the created element anymore.
      // This is because it can sometimes return multiple elements now, likely due to fragments.
      // To still get a reference in order to place it in `this.el`, we create a clone with a ref.
      const ref = createRef()
      const clone = cloneElement(this.render(this.uppy.getState()), { ref })

      render(clone, targetElement)

      this.el = ref.current

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
      this.uppy.iteratePlugins(p => {
        if (p instanceof Target) {
          targetPlugin = p
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
      message += ' The given target is not a Plugin class. '
        + 'Please check that you\'re not specifying a React Component instead of a plugin. '
        + 'If you are using @uppy/* packages directly, make sure you have only 1 version of @uppy/core installed: '
        + 'run `npm ls @uppy/core` on the command line and verify that all the versions match and are deduped correctly.'
    } else {
      message += 'If you meant to target an HTML element, please make sure that the element exists. '
        + 'Check that the <script> tag initializing Uppy is right before the closing </body> tag at the end of the page. '
        + '(see https://github.com/transloadit/uppy/issues/1042)\n\n'
        + 'If you meant to target a plugin, please confirm that your `import` statements or `require` calls are correct.'
    }
    throw new Error(message)
  }
}
