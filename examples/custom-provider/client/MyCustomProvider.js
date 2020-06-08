const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const ProviderViews = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class MyCustomProvider extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'MyCustomProvider'
    Provider.initPlugin(this, opts)

    this.title = 'MyUnsplash'
    this.icon = () => (
      <img src="https://unsplash.com/assets/core/logo-black-df2168ed0c378fa5506b1816e75eb379d06cfcd0af01e07a2eb813ae9b5d7405.svg" width="30" />
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
