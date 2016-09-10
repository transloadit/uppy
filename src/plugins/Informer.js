import Plugin from './Plugin'
import html from '../core/html'

/**
 * Informer
 * Shows rad message bubbles
 * used like this: `bus.emit('informer', 'hello world', 'info', 5000)`
 * or for errors: `bus.emit('informer', 'Error uploading img.jpg', 'error', 5000)`
 *
 */
export default class Informer extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'progressindicator'
    this.id = 'Informer'
    this.title = 'Informer'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  showInformer (msg, type, duration) {
    this.core.setState({
      informer: {
        isHidden: false,
        msg: msg
      }
    })

    if (duration === 0) return

    // hide the informer after `duration` milliseconds
    setTimeout(() => {
      const newInformer = Object.assign({}, this.core.getState().informer, {
        isHidden: true
      })
      this.core.setState({
        informer: newInformer
      })
    }, duration)
  }

  hideInformer () {
    const newInformer = Object.assign({}, this.core.getState().informer, {
      isHidden: true
    })
    this.core.setState({
      informer: newInformer
    })
  }

  render (state) {
    const msg = state.informer.msg
    const isHidden = state.informer.isHidden

    // @TODO add aria-live for screen-readers
    return html`<div class="UppyInformer" aria-hidden="${isHidden}">
      <p>${msg}</p>
    </div>`
  }

  install () {
    // Set default state for Google Drive
    this.core.setState({
      informer: {
        isHidden: true,
        msg: ''
      }
    })

    const bus = this.core.bus

    bus.on('informer', (msg, type, duration) => {
      this.showInformer(msg, type, duration)
    })

    bus.on('informer-hide', () => {
      this.hideInformer()
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }
}
