const { Plugin } = require('@uppy/core')
const { h } = require('preact')
const { SearchProvider } = require('@uppy/companion-client')
const { SearchProviderViews } = require('@uppy/provider-views')

/**
 * Unsplash
 *
 */
module.exports = class Unsplash extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Unsplash'
    this.title = this.opts.title || 'Unsplash'
    this.type = 'acquirer'
    this.icon = () => (
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" fill="#000000" fill-rule="nonzero" />
      </svg>
    )

    const defaultOptions = {}
    this.opts = { ...defaultOptions, ...opts }
    this.hostname = this.opts.companionUrl

    if (!this.hostname) {
      throw new Error('Companion hostname is required, please consult https://uppy.io/docs/companion')
    }

    this.provider = new SearchProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      provider: 'unsplash',
      pluginId: this.id
    })
  }

  install () {
    this.view = new SearchProviderViews(this, {
      provider: this.provider
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  onFirstRender () {
    // do nothing
  }

  render (state) {
    return this.view.render(state)
  }

  uninstall () {
    this.unmount()
  }
}
