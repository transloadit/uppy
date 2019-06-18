const { Plugin } = require('@uppy/core')
const { h } = require('preact')

/**
 * Informer
 * Shows rad message bubbles
 * used like this: `uppy.info('hello world', 'info', 5000)`
 * or for errors: `uppy.info('Error uploading img.jpg', 'error', 5000)`
 *
 */
module.exports = class Informer extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'progressindicator'
    this.id = this.opts.id || 'Informer'
    this.title = 'Informer'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  render (state) {
    const { isHidden, message, details } = state.info

    return (
      <div class="uppy uppy-Informer"
        aria-hidden={isHidden}>
        <p role="alert">
          {message}
          {' '}
          {details && <span
            aria-label={details}
            data-microtip-position="top-left"
            data-microtip-size="medium"
            role="tooltip">?</span>
          }
        </p>
      </div>
    )
  }

  install () {
    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }
}
