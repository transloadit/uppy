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
  }

  render (state) {
    return yo`
      <div class="wow-this-works">
        <input type="text" value="hello">
        I am a dummy plugin, look at me, I was rendered in a modal! That’s crazy, I know.
      </div>
    `
  }

  focus () {
    const firstInput = document.querySelector(`${this.target} *:input[type!=hidden]:first`)
    firstInput.focus()
  }

  install (state) {
    this.el = this.render(this.core.state)
    this.target = this.getTarget(this.opts.target, this, this.el, this.render.bind(this))
  }
}
