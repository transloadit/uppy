import { h, type ComponentChild } from 'preact'
import { useState, useCallback } from 'preact/hooks'

import {
  UIPlugin,
  type Body,
  type Meta,
  type UnknownProviderPlugin,
  type UppyFile,
} from '@uppy/core'
import {
  Provider,
  tokenStorage,
  type CompanionPluginOptions,
} from '@uppy/companion-client'
import { defaultPickerIcon, ProviderViews } from '@uppy/provider-views'

import type {
  AsyncStore,
  UnknownProviderPluginState,
  Uppy,
} from '@uppy/core/lib/Uppy.js'
import type Translator from '@uppy/utils/lib/Translator'
import packageJson from '../package.json'
import locale from './locale.ts'

class WebdavSimpleAuthProvider<M extends Meta, B extends Body> extends Provider<
  M,
  B
> {
  async login({
    authFormData,
    uppyVersions,
    signal,
  }: {
    uppyVersions: string
    authFormData: unknown
    signal: AbortSignal
  }) {
    return this.loginSimpleAuth({ uppyVersions, authFormData, signal })
  }

  async logout<ResBody>(): Promise<ResBody> {
    await this.removeAuthToken()
    return {
      ok: true,
      revoked: true,
    } as unknown as ResBody
  }
}

const AuthForm = ({
  loading,
  i18n,
  onAuth,
}: {
  loading: boolean | string
  i18n: Translator['translateArray']
  onAuth: (arg: { webdavUrl: string }) => void
}) => {
  const [webdavUrl, setWebdavUrl] = useState('')

  const onSubmit = useCallback(
    (e: Event) => {
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
          onChange={(e) => setWebdavUrl((e.target as HTMLInputElement).value)}
          disabled={Boolean(loading)}
        />
      </label>
      <span style={{ display: 'block' }}>
        {i18n('publicLinkURLDescription')}
      </span>

      <button
        style={{ display: 'block' }}
        disabled={Boolean(loading)}
        type="submit"
      >
        Submit
      </button>
    </form>
  )
}

export type WebdavOptions = CompanionPluginOptions

export default class Webdav<M extends Meta, B extends Body>
  extends UIPlugin<WebdavOptions, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element = defaultPickerIcon

  provider: Provider<M, B>

  view!: ProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  rootFolderId: string | null = null

  constructor(uppy: Uppy<M, B>, opts: WebdavOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'WebDav'
    this.type = 'acquirer'
    this.files = []
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

    // this.onFirstRender = this.onFirstRender.bind(this)
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

  render(state: unknown): ComponentChild {
    return this.view.render(state)
  }
}
