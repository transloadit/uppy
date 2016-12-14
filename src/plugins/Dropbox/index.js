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
      <svg class="UppyIcon UppyModalTab-icon" viewBox="0 0 225.000000 225.000000">
        <g transform="translate(0.000000,225.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
        <path d="M633 1646 c-112 -72 -203 -134 -203 -137 0 -3 61 -54 135 -113 74 -59 135 -111 135 -116 0 -5 -61 -57
        -135 -116 -74 -59 -135 -110 -135 -113 1 -7 391 -261 403 -262 5 -1 72 52 149 116 l141 118 -54 33 c-30 18 -123 75
        -206 126 -84 51 -153 95 -153 98 0 3 69 47 153 98 83 51 176 108 206 126 l53 33 -123 103 c-68 57 -133 111 -144
        121 -19 16 -27 12 -222 -115z"/>
        <path d="M1271 1657 l-143 -120 53 -33 c30 -18 123 -75 206 -126 84 -51 153 -95 153 -98 0 -3 -69 -47 -153 -98 -83
        -51 -176 -108 -206 -126 l-54 -33 139 -116 c77 -64 142 -117 145 -119 8 -3 408 254 409 263 0 3 -61 54 -135 113 -74
        59 -135 111 -135 116 0 5 61 57 135 116 74 59 135 110 135 113 0 3 -51 39 -113 78 -61 40 -153 99 -202 132 l-91 58
        -143 -120z"/>
        <path d="M981 849 c-159 -132 -141 -127 -228 -67 l-43 29 0 -44 0 -45 207 -123 c114 -68 210 -123 213 -122 4 1 98 57
        209 123 l201 121 0 45 0 45 -61 -41 c-52 -36 -62 -40 -77 -28 -9 7 -69 56 -132 108 -63 52 -122 100 -130 107
        -13 10 -40 -9 -159 -108z"/>
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

    this.Dropbox.auth()
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
