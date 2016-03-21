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
    return yo`<div class="UppyProgressDrawer">
      <ul>
        ${state.files.map((file, index) => {
          const remove = (ev) => {
            this.core.emitter.emit('remove-item', index)
          }

          return yo`<li>${file.name} <button onclick=${remove}>x</button></li>`
        })}
      </ul>
    </div>`
  }

  // all actions should be in core, I guess
  events () {
    // this.core.emitter.on('progress', (data) => {
    //   this.update({ progress: data })
    // })

    this.core.emitter.on('remove-item', (index) => {
      const fileList = this.state.files.slice()
      fileList.splice(index, 1)
      this.update({files: fileList})
    })

    this.core.emitter.on('file-selection', (files) => {
      const fileList = this.state.files.slice()
      files.filesSelected.forEach(file => {
        fileList.push(file)
      })
      this.update({files: fileList})
    })
  }

  init () {
    this.state = {files: []}
    this.el = this.render(this.state)
    document.querySelector('.UppyModal').appendChild(this.el)
  }

  install () {
    this.init()
    this.events()
    return
  }
}
