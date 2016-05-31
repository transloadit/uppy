import Utils from '../core/Utils'
import yo from 'yo-yo'

/**
 * Independent Dummy
 *
 */
export default class Dummy {
  constructor (core, opts) {
    // super(core, opts)
    this.type = 'acquirer'
    this.id = 'Dummy'
    this.title = 'Dummy'
    this.core = core

    // set default options
    const defaultOptions = {}

    this.strange = yo`<h1>this is strange 1</h1>`

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  getTarget (target, caller, el, render) {
    const callerPluginName = Utils.getFnName(caller.constructor)

    if (typeof target === 'string') {
      this.core.log(`Installing ${callerPluginName} to ${target}`)

      // clear everything inside the target selector
      // if (replaceTargetContent) {
      //   document.querySelector(target).innerHTML = ''
      // }
      document.querySelector(target).appendChild(el)

      return target
    } else {
      const targetPluginName = Utils.getFnName(target)
      this.core.log(`Installing ${callerPluginName} to ${targetPluginName}`)
      let targetPlugin = this.core.getPlugin(targetPluginName)
      let selectorTarget = targetPlugin.addTarget(caller, render)

      return selectorTarget
    }
  }

  update () {

  }

  render () {
    const bla = yo`<h2>this is strange 2</h2>`
    return yo`
      <div class="wow-this-works">
        <input type="text" value="hello">
        I am a dummy plugin, look at me, I was rendered in a modal! That’s crazy, I know.
        ${this.strange}
        ${bla}
      </div>
    `
  }

  focus () {
    const firstInput = document.querySelector(`${this.target} *:input[type!=hidden]:first`)
    firstInput.focus()
  }

  install () {
    this.el = this.render()
    document.body.appendChild(this.el)
    this.target = this.getTarget(this.opts.target, this, this.el, this.render.bind(this))
  }
}
