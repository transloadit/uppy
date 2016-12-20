import Plugin from '../Plugin'
import 'whatwg-fetch'
import html from '../../core/html'

import Provider from '../../uppy-base/src/plugins/Provider'

import View from '../../generic-provider-views/index'
import icons from './icons'

export default class Dropbox extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Dropbox'
    this.title = 'Dropbox'
    this.stateId = 'dropbox'
    this.icon = html`
      <svg class="UppyIcon" width="128" height="118" viewBox="0 0 128 118">
        <g><path d="M38.145.777L1.108 24.96l25.608 20.507 37.344-23.06z"/>
        <path d="M1.108 65.975l37.037 24.183L64.06 68.525l-37.343-23.06zM64.06 68.525l25.917 21.633 37.036-24.183-25.61-20.51z"/>
        <path d="M127.014 24.96L89.977.776 64.06 22.407l37.345 23.06zM64.136 73.18l-25.99 21.567-11.122-7.262v8.142l37.112 22.256 37.114-22.256v-8.142l-11.12 7.262z"/>
        </g>
      </svg>`

    this[this.id] = new Provider({
      host: this.opts.host,
      provider: 'dropbox'
    })

    this.files = []

    // Visual
    this.render = this.render.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  install () {
    this.view = new View(this)
    // Set default state
    this.core.setState({
      [this.stateId]: {
        authenticated: false,
        files: [],
        folders: [],
        directories: [],
        activeRow: -1,
        filterInput: ''
      }
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this[this.id].auth()
      .then((authenticated) => {
        this.view.updateState({authenticated})
        if (authenticated) {
          this.view.getFolder()
        }
      })

    return
  }

  isFolder (item) {
    return item.is_dir
  }

  getItemData (item) {
    return Object.assign({}, item, {size: item.bytes})
  }

  getItemIcon (item) {
    var icon = icons[item.icon]

    if (!icon) {
      if (name.startsWith('folder')) {
        icon = icons['folder']
      } else {
        icon = icons['page_white']
      }
    }
    return icon()
  }

  getItemSubList (item) {
    return item.contents
  }

  getItemName (item) {
    return item.path.length > 1 ? item.path.substring(1) : item.path
  }

  getMimeType (item) {
    return item.mime_type
  }

  getItemId (item) {
    return item.rev
  }

  getItemRequestPath (item) {
    return encodeURIComponent(this.getItemName(item))
  }

  getItemModifiedDate (item) {
    return item.modified
  }

  render (state) {
    return this.view.render(state)
  }
}
