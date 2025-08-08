import {
  type CompanionPluginOptions,
  Provider,
  tokenStorage,
} from '@uppy/companion-client'
import type {
  AsyncStore,
  Body,
  Meta,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  Uppy,
  UppyFile,
} from '@uppy/core'

import { UIPlugin } from '@uppy/core'
import { ProviderViews, SearchInput } from '@uppy/provider-views'
import type { I18n, LocaleStrings } from '@uppy/utils'
// biome-ignore lint/style/useImportType: h is not a type
import { type ComponentChild, h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

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
  i18n,
  onAuth,
}: {
  i18n: I18n
  onAuth: (arg: { webdavUrl: string }) => void
}) => {
  const [webdavUrl, setWebdavUrl] = useState('')

  const onSubmit = useCallback(() => {
    onAuth({ webdavUrl: webdavUrl.trim() })
  }, [onAuth, webdavUrl])

  return (
    <SearchInput
      searchString={webdavUrl}
      setSearchString={setWebdavUrl}
      submitSearchString={onSubmit}
      inputLabel={i18n('pluginWebdavInputLabel')}
      buttonLabel={i18n('authenticate')}
      wrapperClassName="uppy-SearchProvider"
      inputClassName="uppy-c-textInput uppy-SearchProvider-input"
      showButton
      buttonCSSClassName="uppy-SearchProvider-searchButton"
    />
  )
}

export type WebdavOptions = CompanionPluginOptions & {
  locale?: LocaleStrings<typeof locale>
}

export default class Webdav<M extends Meta, B extends Body>
  extends UIPlugin<WebdavOptions, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

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
    this.icon = () => (
      <svg
        className="uppy-DashboardTab-iconWebdav"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <path
          fill="currentcolor"
          fill-rule="nonzero"
          d="m22.484 10.456 1.661 7.152s1.799-6.175 1.89-6.519c.094-.356-.173-.553-.274-.614l-.036-.02H28s-.796 2.444-1.56 4.854l-.182.577c-.632 2.006-1.194 3.85-1.194 4.062 0 .709.346 1.052.346 1.052h-2.78v-.087a5 5 0 0 0-.115-1.007c-.058-.24-.679-2.248-1.321-4.32l-.184-.592c-.642-2.068-1.255-4.038-1.299-4.202-.08-.305-.222-.334-.253-.336zM10.266 10c1.898 0 4.496 1.236 3.206 5.836C12.327 19.916 9.957 21 8.367 21H4s.18-.049.326-.532c.07-.237.582-2.502 1.095-4.801l.14-.626c.488-2.186.942-4.237.981-4.42.086-.393-.009-.621-.009-.621Zm7.936.456s-.137.287 0 .675c.063.178.71 2.28 1.39 4.5l.266.87 1.296 4.237.06.194.02.068h-2.697l-.518-2.129h-2.61L14.788 21h-2.064l.026-.1c.127-.476.69-2.586 1.256-4.72l.162-.61c.564-2.125 1.092-4.12 1.153-4.377.137-.574-.06-.737-.06-.737zM9.896 11.58h-.911L7.07 19.36h1.143c.755 0 1.89-.942 2.616-3.362.725-2.42.147-4.416-.934-4.416m6.806 2.45-1.09 3.289h2.133z"
        />
      </svg>
    )

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
      renderAuthForm: ({ i18n, onAuth }) => (
        <AuthForm onAuth={onAuth} i18n={i18n} />
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
