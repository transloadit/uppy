import { UIPlugin } from '@uppy/core'
import { Provider } from '@uppy/companion-client'
import { h } from 'preact'

import packageJson from '../package.json'
import DriveProviderViews from './DriveProviderViews.js'
import locale from './locale.js'

export default class GoogleDrive extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'GoogleDrive'
    this.title = this.opts.title || 'Google Drive'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Google Drive'
    this.icon = () => (
      <svg
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <g fillRule="nonzero" fill="none">
          <path d="M7.512 21.998l.882 1.492c.183.314.447.561.756.74l3.15-5.339H6a2 2 0 00.275 1.01l1.237 2.097z" fill="#0066DA" />
          <path d="M16 12.609l-3.15-5.34a2.06 2.06 0 00-.756.74l-5.82 9.872A2 2 0 006 18.891h6.3l3.7-6.282z" fill="#00AC47" />
          <path d="M22.85 24.23c.31-.179.573-.426.756-.74l.367-.617 1.752-2.972c.183-.314.275-.662.275-1.01h-6.3l1.34 2.58 1.81 2.76z" fill="#EA4335" />
          <path d="M16 12.609l3.15-5.34C18.84 7.09 18.486 7 18.12 7h-4.24c-.366 0-.72.101-1.03.27L16 12.608z" fill="#00832D" />
          <path d="M19.7 18.891h-7.4l-3.15 5.34c.31.18.664.269 1.031.269h11.638c.367 0 .722-.101 1.031-.27l-3.15-5.339z" fill="#2684FC" />
          <path d="M22.816 12.946l-2.91-4.936a2.06 2.06 0 00-.756-.74L16 12.608l3.7 6.282h6.289c0-.348-.092-.695-.275-1.01l-2.898-4.935z" fill="#FFBA00" />
        </g>
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'drive',
      pluginId: this.id,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameGoogleDrive')

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new DriveProviderViews(this, {
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
      this.view.getFolder('root', '/'),
    ])
  }

  render (state) {
    return this.view.render(state)
  }
}
