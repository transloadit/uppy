const html = require('yo-yo')
const Plugin = require('../Plugin')

const Provider = require('../../uppy-base/src/plugins/Provider')

const View = require('../../generic-provider-views/index')

module.exports = class Google extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'GoogleDrive'
    this.title = 'Google Drive'
    this.stateId = 'googleDrive'
    this.icon = () => html`
      <svg aria-hidden="true" class="UppyIcon UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>
      </svg>
    `

    // writing out the key explicitly for readability the key used to store
    // the provider instance must be equal to this.id.
    this.GoogleDrive = new Provider(core, {
      host: this.opts.host,
      provider: 'drive',
      authProvider: 'google'
    })

    this.files = []

    this.onAuth = this.onAuth.bind(this)
    // Visual
    this.render = this.render.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  install () {
    this.view = new View(this)
    // Set default state for Google Drive
    this.core.setState({
      // writing out the key explicitly for readability the key used to store
      // the plugin state must be equal to this.stateId.
      googleDrive: {
        authenticated: false,
        files: [],
        folders: [],
        directories: [],
        activeRow: -1,
        filterInput: '',
        isSearchVisible: false
      }
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }

  onAuth (authenticated) {
    this.view.updateState({authenticated})
    if (authenticated) {
      this.view.getFolder('root')
    }
  }

  isFolder (item) {
    return item.mimeType === 'application/vnd.google-apps.folder'
  }

  getItemData (item) {
    return Object.assign({}, item, {size: parseFloat(item.fileSize)})
  }

  getItemIcon (item) {
    return html`<img src=${item.iconLink}/>`
  }

  getItemSubList (item) {
    return item.items.filter((i) => {
      return this.isFolder(i) || !i.mimeType.startsWith('application/vnd.google')
    })
  }

  getItemName (item) {
    return item.title ? item.title : '/'
  }

  getMimeType (item) {
    return item.mimeType
  }

  getItemId (item) {
    return item.id
  }

  getItemRequestPath (item) {
    return this.getItemId(item)
  }

  getItemModifiedDate (item) {
    return item.modifiedByMeDate
  }

  getItemThumbnailUrl (item) {
    return `${this.opts.host}/${this.GoogleDrive.id}/thumbnail/${this.getItemRequestPath(item)}`
  }

  render (state) {
    return this.view.render(state)
  }
}
