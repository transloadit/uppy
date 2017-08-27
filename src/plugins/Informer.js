const Plugin = require('./Plugin')
// const html = require('yo-yo')

const { h } = require('picodom')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

/**
 * Informer
 * Shows rad message bubbles
 * used like this: `uppy.info('hello world', 'info', 5000)`
 * or for errors: `uppy.info('Error uploading img.jpg', 'error', 5000)`
 *
 */
module.exports = class Informer extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'progressindicator'
    this.id = 'Informer'
    this.title = 'Informer'
    // this.timeoutID = undefined

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
    const isHidden = state.info.isHidden
    const msg = state.info.msg
    const type = state.info.type || 'info'
    const style = `background-color: ${this.opts.typeColors[type].bg}; color: ${this.opts.typeColors[type].text};`

    // @TODO add aria-live for screen-readers
    return html`<div class="Uppy UppyTheme--default UppyInformer" style="${style}" aria-hidden="${isHidden}">
      <p>${msg}</p>
    </div>`
  }

  install () {
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }
}
