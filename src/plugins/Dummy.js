import Plugin from './Plugin'
import html from '../core/html'

/**
 * Dummy
 *
 */
export default class Dummy extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Dummy'
    this.title = 'Mr. Plugin'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.strange = html`<h1>this is strange 1</h1>`
    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  render () {
    const bla = html`<h2>this is strange 2</h2>`
    return html`
      <div class="wow-this-works">
        <input class="UppyDummy-firstInput" type="text" value="hello">
        ${this.strange}
        ${bla}
      </div>
    `
  }

  focus () {
    const firstInput = document.querySelector(`${this.target} .UppyDummy-firstInput`)

    // only works for the first time if wrapped in setTimeout for some reason
    // firstInput.focus()
    setTimeout(function () {
      firstInput.focus()
    }, 10)
  }

  install () {
    // const bus = this.core.emitter

    // setTimeout(() => {
    //   bus.emit('informer', 'hello', 'info', 5000)
    // }, 1000)

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }
}
