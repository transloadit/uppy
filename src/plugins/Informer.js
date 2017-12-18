const Plugin = require('../core/Plugin')

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
          bg: '#e74c3c'
        },
        success: {
          text: '#fff',
          bg: '#7ac824'
        }
      }
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  render (state) {
    const { isHidden, type, message, details } = state.info
    const style = {
      backgroundColor: this.opts.typeColors[type].bg,
      color: this.opts.typeColors[type].text
    }

    return (
      <div class="Uppy UppyInformer"
        style={style}
        aria-hidden={isHidden}>
        <p role="alert">
          {message}
          {details && <span style={{ color: this.opts.typeColors[type].bg }}
            data-balloon="{details}"
            data-balloon-pos="up"
            data-balloon-length="large">?</span>
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
