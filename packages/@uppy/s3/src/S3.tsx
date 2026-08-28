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
import {
  type CompanionPluginOptions,
  Provider,
  tokenStorage,
} from '@uppy/core/companion-client'
import { ProviderViews, SearchView } from '@uppy/core/provider-views'
import type { I18n, LocaleStrings } from '@uppy/core/utils'
// biome-ignore lint/style/useImportType: h is not a type
import { type ComponentChild, h } from '@uppy/core/utils/preact'
import { useCallback, useState } from '@uppy/core/utils/preact/hooks'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

class S3SimpleAuthProvider<M extends Meta, B extends Body> extends Provider<
  M,
  B
> {
  async login({
    authFormData,
    uppyVersions = '',
    signal,
  }: {
    uppyVersions?: string
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
  defaultBucket,
}: {
  i18n: I18n
  onAuth: (arg: { bucket: string }) => void
  defaultBucket?: string | undefined
}) => {
  const [bucket, setBucket] = useState(defaultBucket ?? '')

  const onSubmit = useCallback(() => {
    onAuth({ bucket: bucket.trim() })
  }, [onAuth, bucket])

  return (
    <SearchView
      value={bucket}
      onChange={setBucket}
      onSubmit={onSubmit}
      inputLabel={i18n('pluginS3InputLabel')}
    >
      {i18n('authenticate')}
    </SearchView>
  )
}

export type S3Options = CompanionPluginOptions & {
  locale?: LocaleStrings<typeof locale>
  /**
   * Pre-fill the bucket (optionally with `/prefix`) so users only have to click
   * "Connect". Useful for multi-tenant setups where the integrator scopes what
   * a user may browse, e.g. `assets-bucket/customer-123/`.
   */
  bucket?: string
}

export default class S3<M extends Meta, B extends Body>
  extends UIPlugin<S3Options, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

  provider: Provider<M, B>

  view!: ProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  rootFolderId: string | null = null

  constructor(uppy: Uppy<M, B>, opts: S3Options) {
    super(uppy, opts)
    this.id = this.opts.id || 'S3'
    this.type = 'acquirer'
    this.files = []
    this.storage = this.opts.storage || tokenStorage

    this.defaultLocale = locale
    this.i18nInit()
    this.title = this.i18n('pluginNameS3')
    this.icon = () => (
      <svg
        className="uppy-DashboardTab-iconS3"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <g fill="none" fill-rule="evenodd">
          <ellipse cx="16" cy="9" rx="9" ry="3.5" fill="currentcolor" />
          <path
            d="M7 9v14c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5V9"
            stroke="currentcolor"
            stroke-width="2"
          />
          <path
            d="M7 16c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5"
            stroke="currentcolor"
            stroke-width="2"
          />
        </g>
      </svg>
    )

    this.provider = new S3SimpleAuthProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 's3',
      pluginId: this.id,
      supportsRefreshToken: false,
    })

    this.render = this.render.bind(this)
  }

  install() {
    this.view = new ProviderViews(this, {
      provider: this.provider,
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      // Use the plugin's own i18n (which includes our defaultLocale) rather than
      // the core one that ProviderViews hands us, so the label resolves even
      // when the integrator does not load @uppy/locales.
      renderAuthForm: ({ onAuth }) => (
        <AuthForm
          onAuth={onAuth}
          i18n={this.i18n}
          defaultBucket={this.opts.bucket}
        />
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

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    S3: S3<M, B>
  }
}
