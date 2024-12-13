import { h } from 'preact'
import { useState, useCallback } from 'preact/hooks'

import { UIPlugin } from '@uppy/core'
import { Provider, tokenStorage } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'

import packageJson from '../package.json'
import locale from './locale.ts'

class WebdavSimpleAuthProvider extends Provider {
  async login({ authFormData, uppyVersions, signal }) {
    return this.loginSimpleAuth({ uppyVersions, authFormData, signal })
  }

  async logout() {
    this.removeAuthToken()
    return { ok: true, revoked: true }
  }
}

const AuthForm = ({ loading, i18n, onAuth }) => {
  const [webdavUrl, setWebdavUrl] = useState('')

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault()
      onAuth({ webdavUrl: webdavUrl.trim() })
    },
    [onAuth, webdavUrl],
  )

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="uppy-Provider-publicLinkURL">
        <span style={{ display: 'block' }}>{i18n('publicLinkURLLabel')}</span>
        <input
          id="uppy-Provider-publicLinkURL"
          name="webdavUrl"
          type="text"
          value={webdavUrl}
          onChange={(e) => setWebdavUrl(e.target.value)}
          disabled={loading}
        />
      </label>
      <span style={{ display: 'block' }}>
        {i18n('publicLinkURLDescription')}
      </span>

      <button style={{ display: 'block' }} disabled={loading} type="submit">
        Submit
      </button>
    </form>
  )
}

export default class Webdav extends UIPlugin {
  static VERSION = packageJson.version

  constructor(uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'webdav'
    this.type = 'acquirer'
    this.storage = this.opts.storage || tokenStorage

    this.defaultLocale = locale

    this.i18nInit()

    this.title = this.i18n('pluginNameWebdav')

    this.provider = new WebdavSimpleAuthProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'webdav',
      pluginId: this.id,
      supportsRefreshToken: false,
    })

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install() {
    this.view = new ProviderViews(this, {
      provider: this.provider,
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      renderAuthForm: ({ i18n, loading, onAuth }) => (
        <AuthForm loading={loading} onAuth={onAuth} i18n={i18n} />
      ),
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

  onFirstRender() {
    return this.view.getFolder()
  }

  render(state) {
    return this.view.render(state)
  }
}
