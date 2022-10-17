import { h } from 'preact'
import { UIPlugin } from '@uppy/core'
import { SearchProvider, Provider } from '@uppy/companion-client'
import { SearchProviderViews } from '@uppy/provider-views'

import packageJson from '../package.json'

/**
 * Unsplash
 *
 */
export default class Unsplash extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Unsplash'
    this.title = this.opts.title || 'Unsplash'

    Provider.initPlugin(this, opts, {})

    this.icon = () => (
      <svg viewBox="0 0 32 32" height="32" width="32" aria-hidden="true">
        <path d="M46.575 10.883v-9h12v9zm12 5h10v18h-32v-18h10v9h12z" fill="#fff" />
        <rect className="uppy-ProviderIconBg" width="32" height="32" rx="16" />
        <path d="M13 12.5V8h6v4.5zm6 2.5h5v9H8v-9h5v4.5h6z" fill="#fff" />
      </svg>
    )

    if (!this.opts.companionUrl) {
      throw new Error('Companion hostname is required, please consult https://uppy.io/docs/companion')
    }

    this.hostname = this.opts.companionUrl

    this.provider = new SearchProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'unsplash',
      pluginId: this.id,
    })
  }

  install () {
    this.view = new SearchProviderViews(this, {
      provider: this.provider,
      viewType: 'unsplash',
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  // eslint-disable-next-line class-methods-use-this
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
