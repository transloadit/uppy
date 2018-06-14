const Plugin = require('@uppy/core/lib/Plugin')
const { Provider } = require('@uppy/server-utils')
const { ProviderView } = require('../../views')
const icons = require('./icons')
const { h } = require('preact')

module.exports = class Dropbox extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'Dropbox'
    this.title = 'Dropbox'
    this.icon = () => (
      <svg class="UppyIcon" width="128" height="118" viewBox="0 0 128 118">
        <path d="M38.145.777L1.108 24.96l25.608 20.507 37.344-23.06z" />
        <path d="M1.108 65.975l37.037 24.183L64.06 68.525l-37.343-23.06zM64.06 68.525l25.917 21.633 37.036-24.183-25.61-20.51z" />
        <path d="M127.014 24.96L89.977.776 64.06 22.407l37.345 23.06zM64.136 73.18l-25.99 21.567-11.122-7.262v8.142l37.112 22.256 37.114-22.256v-8.142l-11.12 7.262z" />
      </svg>
    )

    // writing out the key explicitly for readability the key used to store
    // the provider instance must be equal to this.id.
    this[this.id] = new Provider(uppy, {
      serverUrl: this.opts.serverUrl,
      provider: 'dropbox'
    })

    this.files = []

    this.onAuth = this.onAuth.bind(this)
    this.render = this.render.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
    this.opts.serverPattern = opts.serverPattern || opts.serverUrl
  }

  install () {
    this.view = new ProviderView(this)
    // Set default state for Dropbox
    this.setPluginState({
      authenticated: false,
      files: [],
      folders: [],
      directories: [],
      activeRow: -1,
      filterInput: '',
      isSearchVisible: false
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.view.tearDown()
    this.unmount()
  }

  onAuth (authenticated) {
    this.setPluginState({ authenticated })
    if (authenticated) {
      this.view.getFolder()
    }
  }

  getUsername (data) {
    return data.user_email
  }

  isFolder (item) {
    return item['.tag'] === 'folder'
  }

  getItemData (item) {
    return item
  }

  getItemIcon (item) {
    return icons[item['.tag']]()
  }

  getItemSubList (item) {
    return item.entries
  }

  getItemName (item) {
    return item.name || ''
  }

  getMimeType (item) {
    // mime types aren't supported.
    return null
  }

  getItemId (item) {
    return item.id
  }

  getItemRequestPath (item) {
    return encodeURIComponent(item.path_lower)
  }

  getItemModifiedDate (item) {
    return item.server_modified
  }

  getItemThumbnailUrl (item) {
    return `${this.opts.serverUrl}/${this.Dropbox.id}/thumbnail/${this.getItemRequestPath(item)}`
  }

  render (state) {
    return this.view.render(state)
  }
}
