import { UIPlugin } from '@uppy/core'
import { Provider } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'
import { h } from 'preact'

import packageJson from '../package.json'
import locale from './locale.js'

export default class Facebook extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Facebook'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Facebook'
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <g fill="none" fillRule="evenodd">
          <path d="M26 16c0-5.523-4.477-10-10-10-5.524 0-10.001 4.477-10.001 10 0 4.991 3.657 9.129 8.438 9.879V18.89h-2.54V16h2.54v-2.203c0-2.507 1.493-3.891 3.777-3.891 1.094 0 2.239.195 2.239.195v2.461h-1.261c-1.243 0-1.63.771-1.63 1.562V16h2.774l-.444 2.89h-2.33v6.989c4.78-.75 8.438-4.888 8.438-9.88" fill="#1777F2" />
          <path d="M19.892 18.89l.444-2.89h-2.774v-1.876c0-.791.387-1.562 1.63-1.562h1.26v-2.461s-1.144-.195-2.238-.195c-2.284 0-3.777 1.384-3.777 3.89V16h-2.54v2.89h2.54v6.989a10.075 10.075 0 003.125 0V18.89h2.33" fill="#FFFFFE" />
        </g>
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'facebook',
      pluginId: this.id,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameFacebook')

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
    const viewOptions = {}
    if (this.getPluginState().files.length && !this.getPluginState().folders.length) {
      viewOptions.viewType = 'grid'
      viewOptions.showFilter = false
      viewOptions.showTitles = false
    }
    return this.view.render(state, viewOptions)
  }
}
