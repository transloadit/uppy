const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const DriveProviderViews = require('./DriveProviderViews')
const { h } = require('preact')

module.exports = class GoogleDrive extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'GoogleDrive'
    this.title = this.opts.title || 'Google Drive'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Google Drive'
    this.icon = () => (
      <svg aria-hidden="true" width="18px" height="16px" viewBox="0 0 18 16" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <g fill-rule="evenodd">
          <polygon fill="#3089FC" points="6.32475 10.2 18 10.2 14.999625 15.3 3.324375 15.3" />
          <polygon fill="#00A85D" points="3.000375 15.3 0 10.2 5.83875 0.275974026 8.838 5.37597403 5.999625 10.2" />
          <polygon fill="#FFD024" points="11.838375 9.92402597 5.999625 0 12.000375 0 17.839125 9.92402597" />
        </g>
      </svg>
    )

    this.provider = new Provider(uppy, {
      serverUrl: this.opts.serverUrl,
      serverHeaders: this.opts.serverHeaders,
      storage: this.opts.storage,
      provider: 'drive',
      authProvider: 'google',
      pluginId: this.id
    })

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new DriveProviderViews(this, {
      provider: this.provider
    })
    // Set default state for Google Drive
    this.setPluginState({
      authenticated: false,
      files: [],
      folders: [],
      directories: [],
      activeRow: -1,
      filterInput: '',
      isSearchVisible: false,
      hasTeamDrives: false,
      teamDrives: [],
      teamDriveId: ''
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
    return this.view.getFolder('root', '/')
  }

  render (state) {
    return this.view.render(state)
  }
}
