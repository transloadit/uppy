const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const ProviderViews = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class Facebook extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Facebook'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Facebook'
    this.icon = () => (
      <svg
        version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
        width="266.893px" height="266.895px" viewBox="0 0 266.893 266.895" enable-background="new 0 0 266.893 266.895"
      >
        <path
          id="Blue_1_" fill="#3C5A99" d="M248.082,262.307c7.854,0,14.223-6.369,14.223-14.225V18.812
          c0-7.857-6.368-14.224-14.223-14.224H18.812c-7.857,0-14.224,6.367-14.224,14.224v229.27c0,7.855,6.366,14.225,14.224,14.225
          H248.082z"
        />
        <path
          id="f" fill="#FFFFFF" d="M182.409,262.307v-99.803h33.499l5.016-38.895h-38.515V98.777c0-11.261,3.127-18.935,19.275-18.935
          l20.596-0.009V45.045c-3.562-0.474-15.788-1.533-30.012-1.533c-29.695,0-50.025,18.126-50.025,51.413v28.684h-33.585v38.895h33.585
          v99.803H182.409z"
        />
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders || this.opts.serverHeaders,
      provider: 'facebook',
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
    const viewOptions = {}
    if (this.getPluginState().files.length && !this.getPluginState().folders.length) {
      viewOptions.viewType = 'grid'
      viewOptions.showFilter = false
      viewOptions.showTitles = false
    }
    return this.view.render(state, viewOptions)
  }
}
