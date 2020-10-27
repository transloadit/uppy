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
      <svg viewBox="0 0 32 32" height="32" width="32" aria-hidden="true">
        <path d="M46.575 10.883v-9h12v9zm12 5h10v18h-32v-18h10v9h12z" fill="#fff" />
        <rect width="32" height="32" rx="16" />
        <path d="M13 12.5V8h6v4.5zm6 2.5h5v9H8v-9h5v4.5h6z" fill="#fff" />
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
