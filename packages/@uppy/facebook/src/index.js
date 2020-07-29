const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const { ProviderViews } = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class Facebook extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Facebook'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Facebook'
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <g fill="none" fill-rule="evenodd">
          <rect width="32" height="32" rx="16" fill="#3C5A99" />
          <path d="M17.842 26v-8.667h2.653l.398-3.377h-3.051v-2.157c0-.978.248-1.644 1.527-1.644H21V7.132A19.914 19.914 0 0 0 18.623 7c-2.352 0-3.963 1.574-3.963 4.465v2.49H12v3.378h2.66V26h3.182z" fill="#FFF" fill-rule="nonzero" />
        </g>
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
