import Plugin from './Plugin'
import vdom from 'virtual-dom'
import hyperx from 'hyperx'
import main from 'main-loop'

// should be core methods/members
const hx = hyperx(vdom.h)
const loop = main({clickedTimes: 0}, this.render, vdom)
// require('./actions.js')(bus, loop)

/**
 * Progress drawer
 *
 */
export default class ProgressDrawer extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  render (state) {
    return hx`<div>
      ${state.bla}
    </div>`
  }

  // all actions should be in core, I guess
  events () {
    this.core.emitter.on('progress', function () {
      this.updateState({ progress: loop.state.clickedTimes + 1 })
    })

    this.core.emitter.on('linkClicked', function () {
      this.updateState({ linkClicked: 'даааа!' })
    })
  }

  // this too should be a common method
  updateState (updatedState) {
    loop.update(Object.assign({}, loop.state, updatedState))
  }

  init () {
    // const caller = this
    // this.target = this.getTarget(this.opts.target, caller)
    // this.targetEl = document.querySelector(this.target)
    // this.targetEl.innerHTML = this.render()
    document.querySelector('.UppyModal').appendChild(loop.target)
  }

  install () {
    this.init()
    this.events()
    return
  }
}
