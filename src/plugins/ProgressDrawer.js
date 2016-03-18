import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Progress drawer
 *
 */
export default class ProgressDrawer extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.name = 'Progress Drawer'
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  update (newState) {
    Object.assign(this.state, newState)
    var newEl = this.render(this.state)
    yo.update(this.el, newEl)
  }

  bla () {
    console.log('hello!')
    this.update({name: 'Igor', time: Date.now()})
  }

  render (state) {
    return yo`<div>
      <h1>My name is ${state.name}</h1>
      <button type="button" onclick=${this.bla.bind(this)}>Click me!</button>
      <time>${state.time}</time>
      <div style="width: 300px; height: 200px; background-color: ${state.color}; overflow: scroll">
        <p>123This page demonstrates how to make a dialog window as accessible as possible to assistive technology users. Dialog windows are especially problematic for screen reader users. Often times the user is able to “escape” the window and interact with other parts of the page when they should not be able to. This is partially due to the way screen reader software interacts with the browser.</p>
        <p>To see this in action, you just need to open the dialog window. Once it’s open, you should not be able to interact with other links on the main page like going to the main GitHub page. The focus is said to be “trapped” inside the dialog until the user explicitely decides to leave it.</p>
      </div>
    </div>`
  }

  // all actions should be in core, I guess
  events () {
    this.core.emitter.on('progress', (data) => {
      this.update({ progress: data })
    })
  }

  init () {
    this.state = {name: 'Artur', color: 'green'}
    this.el = this.render(this.state)
    document.body.appendChild(this.el)
  }

  install () {
    this.init()
    this.events()
    return
  }
}
