const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const { ProviderViews } = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class MyCustomProvider extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'MyCustomProvider'
    Provider.initPlugin(this, opts)

    this.title = 'MyUnsplash'
    this.icon = () => (
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" fill="#000000" fill-rule="nonzero" />
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders || this.opts.serverHeaders,
      provider: 'myunsplash',
      pluginId: this.id
    })

    this.files = []
    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)

    // merge default options with the ones set by user
    this.opts = Object.assign({}, opts)
  }

  install () {
    this.view = new ProviderViews(this, {
      provider: this.provider
    })
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

  onFirstRender () {
    return this.view.getFolder()
  }

  render (state) {
    return this.view.render(state)
  }
}
