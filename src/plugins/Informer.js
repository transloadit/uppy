const Plugin = require('./Plugin')
const html = require('yo-yo')

/**
 * Informer
 * Shows rad message bubbles
 * used like this: `core.emit('informer', 'hello world', 'info', 5000)`
 * or for errors: `core.emit('informer', 'Error uploading img.jpg', 'error', 5000)`
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

  // showInformer (msg, type, duration) {
  //   this.core.setState({
  //     informer: {
  //       isHidden: false,
  //       type: type,
  //       msg: msg
  //     }
  //   })

  //   window.clearTimeout(this.timeoutID)
  //   if (duration === 0) {
  //     this.timeoutID = undefined
  //     return
  //   }

  //   // hide the informer after `duration` milliseconds
  //   this.timeoutID = setTimeout(() => {
  //     const newInformer = Object.assign({}, this.core.getState().informer, {
  //       isHidden: true
  //     })
  //     this.core.setState({
  //       informer: newInformer
  //     })
  //   }, duration)
  // }

  // hideInformer () {
  //   const newInformer = Object.assign({}, this.core.getState().informer, {
  //     isHidden: true
  //   })
  //   this.core.setState({
  //     informer: newInformer
  //   })
  // }

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
    // this.core.setState({
    //   informer: {
    //     isHidden: true,
    //     type: '',
    //     msg: ''
    //   }
    // })

    // this.core.on('informer', (msg, type, duration) => {
    //   this.showInformer(msg, type, duration)
    // })

    // this.core.on('informer:hide', () => {
    //   this.hideInformer()
    // })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }
}
