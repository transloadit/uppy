const Plugin = require('@uppy/core/lib/Plugin')
const { Provider } = require('@uppy/server-utils')
const ProviderViews = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class MyCustomProvider extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'MyCustomProvider'
    this.title = 'MyCustomProvider'
    this.icon = () => (
      <img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="23" />
    )

    // writing out the key explicitly for readability the key used to store
    // the provider instance must be equal to this.id.
    this[this.id] = new Provider(uppy, {
      serverUrl: this.opts.serverUrl,
      provider: 'mycustomprovider'
    })

    this.files = []
    this.onAuth = this.onAuth.bind(this)
    this.render = this.render.bind(this)

    // merge default options with the ones set by user
    this.opts = Object.assign({}, opts)
  }

  install () {
    this.view = new ProviderViews(this)
    // Set default state
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

  isFolder (item) {
    return false
  }

  getItemData (item) {
    return item
  }

  getItemIcon (item) {
    return () => (
      <img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" />
    )
  }

  getItemSubList (item) {
    return item.entries
  }

  getItemName (item) {
    return item.name
  }

  getMimeType (item) {
    // mime types aren't supported.
    return null
  }

  getItemId (item) {
    return item.name
  }

  getItemRequestPath (item) {
    return encodeURIComponent(item.name)
  }

  getItemModifiedDate (item) {
    return Date.now()
  }

  getItemThumbnailUrl (item) {
    return 'https://uppy.io/images/logos/uppy-dog-head-arrow.svg'
  }

  render (state) {
    return this.view.render(state)
  }
}
