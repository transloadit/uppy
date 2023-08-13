import { h } from 'preact'
import { useState, useCallback } from 'preact/hooks'

import { UIPlugin } from '@uppy/core'
import { Provider } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'

import packageJson from '../package.json'
import locale from './locale.js'

class FtpProvider extends Provider {
  async login ({ authFormData, uppyVersions, signal }) {
    const response = await this.post(`${this.id}/simple-auth`, { form: authFormData }, { qs: { uppyVersions }, signal })
    this.setAuthToken(response.uppyAuthToken)
  }

  async logout () {
    this.removeAuthToken()
    return { ok: true, revoked: true }
  }
}

const AuthForm = ({ loading, onAuth }) => {
  const [host, setHost] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = useCallback((e) => {
    e.preventDefault()
    onAuth({ host, username, password })
  }, [host, onAuth, password, username])

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="uppy-Provider-ftp-host">
        <span style={{ display: 'block' }}>FTP host</span>
        <input disabled={loading} name="host" type="text" autoComplete="off" value={host} onChange={(e) => setHost(e.target.value)} />
      </label>

      <label htmlFor="uppy-Provider-ftp-username">
        <span style={{ display: 'block' }}>username</span>
        <input disabled={loading} name="username" type="text" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>

      <label htmlFor="uppy-Provider-ftp-password">
        <span style={{ display: 'block' }}>password</span>
        <input disabled={loading} name="password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      <button disabled={loading} style={{ display: 'block' }} type="submit">Submit</button>
    </form>
  )
}

export default class Ftp extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ftp'
    Provider.initPlugin(this, opts)

    this.defaultLocale = locale
    this.i18nInit()

    this.title = 'FTP'

    this.provider = new FtpProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'ftp',
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
      renderAuthForm: ({ loading, onAuth }) => <AuthForm loading={loading} onAuth={onAuth} />,
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
