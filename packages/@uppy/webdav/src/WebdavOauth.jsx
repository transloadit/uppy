import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'

import { UIPlugin } from '@uppy/core'
import { Provider } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'

import packageJson from '../package.json'
import locale from './locale.js'

class WebdavOauthProvider extends Provider {
  // eslint-disable-next-line class-methods-use-this
  authQuery ({ authFormData }) {
    const { webdavUrl } = authFormData

    return {
      subdomain: new URL(webdavUrl).host || webdavUrl,
    }
  }
}

const AuthForm = ({ loading, i18n, onAuth }) => {
  const [webdavUrl, setWebdavUrl] = useState('')

  const onSubmit = useCallback((e) => {
    e.preventDefault()
    onAuth({ webdavUrl })
  }, [onAuth, webdavUrl])

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="uppy-Provider-publicLinkURL">
        <span>{i18n('publicLinkURLLabel')}</span>
        <input id="uppy-Provider-publicLinkURL" name="webdavUrl" type="text" value={webdavUrl} onChange={(e) => setWebdavUrl(e.target.value)} disabled={loading} />
      </label>
      <span>{i18n('publicLinkURLDescription')}</span>

      <button style={{ display: 'block' }} disabled={loading} type="submit">Submit</button>
    </form>
  )
}

export default class WebdavOauth extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'webdavOauth'
    Provider.initPlugin(this, opts)

    this.defaultLocale = locale
    this.i18nInit()

    this.title = this.i18n('pluginNameWebdavOauth')

    this.provider = new WebdavOauthProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'webdavOauth',
      pluginId: this.id,
      supportsRefreshToken: false,
    })

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
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

  uninstall () {
    this.view.tearDown()
    this.unmount()
  }

  onFirstRender () {
    return this.view.getFolder()
  }

  render (state) {
    return this.view.render(state)
  }
}
