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
      <svg aria-hidden="true" width="128" height="128" viewBox="0 0 128 128">
        <path d="M31.997 11L64 31.825 31.997 52.651 0 31.825 31.997 11zM96 11l32 20.825-32 20.826-32-20.826L96 11zM0 73.476l31.997-20.825L64 73.476 31.997 94.302 0 73.476zm96-20.825l32 20.825-32 20.826-32-20.826 32-20.825zm-64.508 48.254l32.003-20.826 31.997 20.826-31.997 20.825-32.003-20.825z" fill="#0260FF" fill-rule="nonzero" />
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
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
