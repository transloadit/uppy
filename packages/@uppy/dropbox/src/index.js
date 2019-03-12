const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const ProviderViews = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class Dropbox extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Dropbox'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Dropbox'
    this.icon = () => (
      <svg aria-hidden="true" fill="#0060ff" width="128" height="118" viewBox="0 0 128 118">
        <path d="M38.145.777L1.108 24.96l25.608 20.507 37.344-23.06z" />
        <path d="M1.108 65.975l37.037 24.183L64.06 68.525l-37.343-23.06zM64.06 68.525l25.917 21.633 37.036-24.183-25.61-20.51z" />
        <path d="M127.014 24.96L89.977.776 64.06 22.407l37.345 23.06zM64.136 73.18l-25.99 21.567-11.122-7.262v8.142l37.112 22.256 37.114-22.256v-8.142l-11.12 7.262z" />
      </svg>
    )

    this.provider = new Provider(uppy, {
      serverUrl: this.opts.serverUrl,
      serverHeaders: this.opts.serverHeaders,
      storage: this.opts.storage,
      provider: 'dropbox',
      pluginId: this.id
    })

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new ProviderViews(this, {
      provider: this.provider
    })
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

  onFirstRender () {
    return this.view.getFolder()
  }

  render (state) {
    return this.view.render(state)
  }
}
