const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const { ProviderViews } = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class Zoom extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Zoom'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Zoom'
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <rect className="uppy-ProviderIconBg" width="32" height="32" rx="16" fill="#0E71EB" />
        <g fill="none" fillRule="evenodd">
          <path fill="#fff" d="M29,31H14c-1.657,0-3-1.343-3-3V17h15c1.657,0,3,1.343,3,3V31z" style="transform: translate(-5px, -5px) scale(0.9);" />
          <polygon fill="#fff" points="37,31 31,27 31,21 37,17" style="transform: translate(-5px, -5px) scale(0.9);" />
        </g>
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders || this.opts.serverHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'zoom',
      pluginId: this.id,
    })

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new ProviderViews(this, {
      provider: this.provider,
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
    return Promise.all([
      this.provider.fetchPreAuthToken(),
      this.view.getFolder(),
    ])
  }

  render (state) {
    return this.view.render(state)
  }
}
