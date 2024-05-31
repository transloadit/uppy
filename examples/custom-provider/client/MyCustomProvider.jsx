/** @jsx h */

import { UIPlugin } from '@uppy/core'
import { Provider, getAllowedHosts, tokenStorage } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'
import { h } from 'preact'

const defaultOptions = {}

export default class MyCustomProvider extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'MyCustomProvider'
    this.type = 'acquirer'
    this.storage = this.opts.storage || tokenStorage
    this.files = []
    this.rootFolderId = null

    this.icon = () => (
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"
          fill="#000000"
          fillRule="nonzero"
        />
      </svg>
    )

    this.opts.companionAllowedHosts = getAllowedHosts(
      this.opts.companionAllowedHosts,
      this.opts.companionUrl,
    )
    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      provider: 'myunsplash',
      pluginId: this.id,
    })

    uppy.registerRequestClient(MyCustomProvider.name, this.provider)

    this.defaultLocale = {
      strings: {
        pluginNameMyUnsplash: 'MyUnsplash',
      },
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()
    this.title = this.i18n('pluginNameMyUnsplash')

    this.files = []
  }

  install() {
    this.view = new ProviderViews(this, {
      provider: this.provider,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall() {
    this.view.tearDown()
    this.unmount()
  }

  render(state) {
    return this.view.render(state)
  }
}
