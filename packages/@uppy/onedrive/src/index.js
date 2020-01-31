const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const ProviderViews = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class OneDrive extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'OneDrive'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'OneDrive'
    this.icon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <path fill="#1565c0" d="M40.429,35.999c0,0,2.89-0.393,3.47-3.185C43.964,32.502,44,32.161,44,31.787 c0-0.233-0.015-0.454-0.044-0.665c-0.428-3.158-3.852-3.868-3.852-3.868s0.595-3.401-2.543-5.183c-3.138-1.78-6.005,0-6.005,0 s-1.678-3.401-6.222-3.401c-5.843,0-6.817,6.64-6.817,6.64S13,25.636,13,30.493C13,35.352,18.031,36,18.031,36L40.429,35.999 L40.429,35.999z" />
        <path fill="#1565c0" d="M11,30.493c0-4.395,3.286-6.319,5.875-6.945c0.898-2.954,3.384-6.878,8.46-6.878 c0.006,0,0.011,0.001,0.017,0.001c0.007,0,0.013-0.001,0.02-0.001c3.522,0,5.71,1.646,6.892,2.953 c0.65-0.191,1.448-0.343,2.347-0.343c0.004,0,0.007,0.001,0.011,0.001c0.003,0,0.006,0,0.01,0c0.02,0,0.039,0.004,0.059,0.004 C34.729,19,34.063,12,26.013,12c-5.503,0-7.446,4.691-7.446,4.691s-3.992-2.965-8.092,1.133c-2.105,2.104-1.619,5.338-1.619,5.338 S4,23.648,4,28.825C4.001,33.515,9.018,34,9.018,34h2.807C11.32,33.041,11,31.886,11,30.493z" />
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders || this.opts.serverHeaders,
      provider: 'onedrive',
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
