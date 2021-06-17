/**
 * Core plugin logic that all plugins share.
 *
 * BasePlugin does not contain DOM rendering so it can be used for plugins
 * without an user interface.
 *
 * See `Plugin` for the extended version with Preact rendering for interfaces.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @returns {Array|string} files or success/fail message
 */
module.exports = class BasePlugin {
  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = opts || {}

    this.update = this.update.bind(this)
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
          ...update,
        },
      },
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

    if (this.updateUI) {
      this.updateUI(state)
    }
  }

  unmount () {
    if (this.isTargetDOMEl && this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
    }
  }

  /**
   * Extendable methods
   * ==================
   * These methods are here to serve as an overview of the extendable methods as well as
   * making them not conditional in use, such as `if (this.afterUpdate)`.
   */

  // eslint-disable-next-line class-methods-use-this
  addTarget () {
    throw new Error('Extend the addTarget method to add your plugin to another plugin\'s target')
  }

  // eslint-disable-next-line class-methods-use-this
  install () {}

  uninstall () {
    this.unmount()
  }

  /**
   * Called when plugin is mounted, whether in DOM or into another plugin.
   * Needed because sometimes plugins are mounted separately/after `install`,
   * so this.el and this.parent might not be available in `install`.
   * This is the case with @uppy/react plugins, for example.
   */
  render () {
    throw new Error('Extend the render method to add your plugin to a DOM element')
  }

  // eslint-disable-next-line class-methods-use-this
  onMount () {}

  // Called after every state update, after everything's mounted. Debounced.
  // eslint-disable-next-line class-methods-use-this
  afterUpdate () {}
}
