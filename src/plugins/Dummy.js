import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Dummy
 *
 */
export default class Dummy extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Dummy'
    this.title = 'Dummy'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.strange = yo`<h1>this is strange 1</h1>`
    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  render () {
    const bla = yo`<h2>this is strange 2</h2>`
    return yo`
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
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }
}
