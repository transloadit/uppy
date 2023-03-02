import { h } from 'preact'

import { UIPlugin } from '@uppy/core'
import { Provider } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'

import packageJson from '../package.json'
import locale from './locale.js'

export default class OneDrive extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'OneDrive'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'OneDrive'
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <g fill="none" fillRule="nonzero">
          {/* <rect className="uppy-ProviderIconBg" width="32" height="32" rx="16" fill="#0262C0" /> */}
          <path d="M13.627 12.558l4.198 2.514 2.502-1.052a4.048 4.048 0 011.885-.322 6.25 6.25 0 00-11.276-1.884l.064-.001a4.975 4.975 0 012.627.745z" fill="#0364B8" />
          <path d="M13.627 12.558A4.976 4.976 0 0011 11.813l-.064.001a4.998 4.998 0 00-4.038 7.857l3.703-1.558 1.646-.693 3.664-1.542 1.914-.806-4.198-2.514z" fill="#0078D4" />
          <path d="M22.212 13.698a4.048 4.048 0 00-1.885.322l-2.502 1.052.726.435 2.378 1.424 1.037.622 3.548 2.125a4.063 4.063 0 00-3.302-5.98z" fill="#1490DF" />
          <path d="M21.966 17.553l-1.037-.622-2.378-1.424-.726-.435-1.914.806-3.664 1.542-1.646.693-3.703 1.558A4.993 4.993 0 0011 21.813h10.938c1.494 0 2.867-.82 3.576-2.135l-3.548-2.125z" fill="#28A8EA" />
        </g>
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'onedrive',
      pluginId: this.id,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameOneDrive')

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new ProviderViews(this, {
      provider: this.provider,
    })

    const { target } = this.opts
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
