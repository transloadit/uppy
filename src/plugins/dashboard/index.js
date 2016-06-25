import Plugin from './../Plugin'
import html from 'yo-yo'
import { pluginIcon } from './icons'
import fileItem from './fileItem'
import dragDrop from 'drag-drop'

/**
 * Dashboard — shows selected and uploaded files, as well as their progress,
 * lets you drag & drop files straight into it
 *
 */
export default class Dashboard extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'Dashboard'
    this.title = 'Dashboard'
    this.type = 'acquirer'

    this.icon = pluginIcon

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  render (state) {
    const files = state.files
    const bus = this.core.emitter

    return html`<div class="UppyDashboard">
      <h3 class="UppyDashboard-title">Drag files here or select from</h3>
      <ul class="UppyDashboard-list">
        ${Object.keys(files).map((fileID) => {
          return fileItem(bus, files[fileID])
        })}
      </ul>
    </div>`
  }

  handleDrop (files) {
    this.core.log('All right, someone dropped something...')

    files.forEach((file) => {
      this.core.emitter.emit('file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })

    this.core.addMeta({bla: 'bla'})
  }

  install () {
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    dragDrop(`${this.target} .UppyDashboard`, (files) => {
      this.handleDrop(files)
      this.core.log(files)
    })
  }
}
