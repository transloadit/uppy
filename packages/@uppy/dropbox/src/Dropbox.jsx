import { UIPlugin } from '@uppy/core'
import { Provider, tokenStorage, getAllowedHosts } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'
import { h } from 'preact'

import packageJson from '../package.json'
import locale from './locale.js'

const defaultOptions = {
  storage: tokenStorage,
}

export default class Dropbox extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, { ...defaultOptions, ...opts })
    this.id = this.opts.id || 'Dropbox'
    this.type = 'acquirer'
    this.files = []
    this.icon = () => (
      <svg className="uppy-DashboardTab-iconDropbox" aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <path d="M10.5 7.5L5 10.955l5.5 3.454 5.5-3.454 5.5 3.454 5.5-3.454L21.5 7.5 16 10.955zM10.5 21.319L5 17.864l5.5-3.455 5.5 3.455zM16 17.864l5.5-3.455 5.5 3.455-5.5 3.455zM16 25.925l-5.5-3.455 5.5-3.454 5.5 3.454z" fill="currentcolor" fillRule="nonzero" />
      </svg>
    )

    this.opts.companionAllowedHosts = getAllowedHosts(this.opts.companionAllowedHosts, this.opts.companionUrl)
    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'dropbox',
      pluginId: this.id,
      supportsRefreshToken: true,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.opts.title || this.i18n('pluginNameDropbox')

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new ProviderViews(this, {
      provider: this.provider,
      loadAllFiles: true,
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
