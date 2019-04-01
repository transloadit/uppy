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
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'progressindicator'
    this.id = this.opts.id || 'Informer'
    this.title = 'Informer'

    // set default options
    const defaultOptions = {
      typeColors: {
        info: {
          text: '#fff',
          bg: '#000'
        },
        warning: {
          text: '#fff',
          bg: '#F6A623'
        },
        error: {
          text: '#fff',
          bg: '#D32F2F'
        },
        success: {
          text: '#fff',
          bg: '#1BB240'
        }
      }
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  render (state) {
    const { isHidden, message, details } = state.info
    // const style = {
    //   backgroundColor: this.opts.typeColors[type].bg,
    //   color: this.opts.typeColors[type].text
    // }

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
