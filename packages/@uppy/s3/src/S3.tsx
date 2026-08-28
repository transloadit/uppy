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
import {
  type ProviderAction,
  type ProviderToolbarAction,
  ProviderViews,
  SearchView,
} from '@uppy/core/provider-views'
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
  /** Called after a successful simple-auth with the form data that was sent. */
  onSimpleAuth?: (authFormData: unknown) => Promise<void>

  async login({
    authFormData,
    uppyVersions = '',
    signal,
  }: {
    uppyVersions?: string
    authFormData: unknown
    signal: AbortSignal
  }) {
    await this.loginSimpleAuth({ uppyVersions, authFormData, signal })
    await this.onSimpleAuth?.(authFormData)
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
   * Show management actions (rename/move, delete, new folder). Requires a
   * Companion whose S3 provider allows mutations. Default: true.
   */
  enableActions?: boolean
  /** Extra per-item actions, appended to the built-in ones. */
  actions?: ProviderAction<any, any>[]
  /** Extra toolbar actions, appended to the built-in ones. */
  toolbarActions?: ProviderToolbarAction<any, any>[]
  /**
   * When a `bucket` is configured, connect without showing the auth form.
   * Default: true.
   */
  autoConnect?: boolean
  /**
   * Keep the browsing state (current folder, loaded tree) when the Dashboard
   * panel closes, instead of resetting to the root like pickers do. Useful for
   * management UIs that return to the same folder after an upload. Default: false.
   */
  keepStateOnClose?: boolean
  /**
   * Pre-fill the bucket (optionally with `/prefix`) so users only have to click
   * "Connect". Useful for multi-tenant setups where the integrator scopes what
   * a user may browse, e.g. `assets-bucket/customer-123/`.
   */
  bucket?: string
}

/** Where an object key lives: its parent "folder" prefix and its own name. */
function splitKey(key: string): {
  parent: string
  name: string
  isFolder: boolean
} {
  const isFolder = key.endsWith('/')
  const bare = isFolder ? key.slice(0, -1) : key
  const slash = bare.lastIndexOf('/')
  return {
    isFolder,
    parent: slash === -1 ? '' : bare.slice(0, slash + 1),
    name: bare.slice(slash + 1),
  }
}

export default class S3<M extends Meta, B extends Body>
  extends UIPlugin<S3Options, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

  provider: S3SimpleAuthProvider<M, B>

  view!: ProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  rootFolderId: string | null = null

  #autoConnectAttempted = false

  /** False until we know whether the stored Companion session matches `opts.bucket`. */
  #sessionChecked = false

  /** Storage key remembering which bucket the stored Companion session was opened for. */
  #bucketStorageKey: string

  constructor(uppy: Uppy<M, B>, opts: S3Options) {
    super(uppy, opts)
    this.id = this.opts.id || 'S3'
    this.type = 'acquirer'
    this.files = []
    this.storage = this.opts.storage || tokenStorage
    this.#bucketStorageKey = `companion-${this.id}-s3-bucket`

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
    this.provider.onSimpleAuth = async (authFormData) => {
      const bucket = (authFormData as { bucket?: unknown } | null)?.bucket
      if (typeof bucket === 'string') {
        await this.storage.setItem(this.#bucketStorageKey, bucket)
      }
    }

    this.render = this.render.bind(this)
  }

  /** The S3 object key behind a partial-tree item id (ids are URL-encoded keys). */
  static keyOf(id: string): string {
    return decodeURIComponent(id)
  }

  builtInActions(): ProviderAction<M, B>[] {
    return [
      {
        id: 's3:rename',
        label: this.i18n('renameOrMove'),
        appliesTo: 'all',
        run: async ({ item, view, uppy }) => {
          const key = S3.keyOf(item.id)
          const { parent, name, isFolder } = splitKey(key)
          const input = await view.prompt({
            title: this.i18n('renameOrMoveTitle', { name }),
            label: this.i18n('renameOrMovePrompt'),
            defaultValue: name,
            confirmLabel: this.i18n('rename'),
          })
          const value = input?.trim().replace(/^\/+/, '')
          if (!value) return
          // A bare name renames in place; anything with a "/" is a full key (move).
          const isMove = value.includes('/')
          let destination = isMove ? value : `${parent}${value}`
          if (isFolder && !destination.endsWith('/')) destination += '/'
          if (destination === key) return
          await this.provider.moveItem(key, destination)
          uppy.info(
            isMove
              ? this.i18n('itemMoved', { path: destination })
              : this.i18n('itemRenamed', { name: value }),
            'info',
            3000,
          )
        },
      },
      {
        id: 's3:delete',
        label: this.i18n('deleteItem'),
        appliesTo: 'all',
        run: async ({ item, view, uppy }) => {
          const key = S3.keyOf(item.id)
          const name = item.data.name ?? key
          const confirmed = await view.confirm({
            title: this.i18n('deleteConfirm', { name }),
            message: item.data.isFolder
              ? this.i18n('deleteFolderHint')
              : undefined,
            confirmLabel: this.i18n('deleteItem'),
            danger: true,
          })
          if (!confirmed) return
          await this.provider.deleteItem(key)
          uppy.info(this.i18n('itemDeleted', { name }), 'info', 3000)
        },
      },
    ]
  }

  builtInToolbarActions(): ProviderToolbarAction<M, B>[] {
    return [
      {
        id: 's3:newFolder',
        label: this.i18n('newFolder'),
        run: async ({ currentFolderId, view, uppy }) => {
          const name = (
            await view.prompt({
              title: this.i18n('newFolder'),
              label: this.i18n('newFolderPrompt'),
              confirmLabel: this.i18n('create'),
            })
          )?.trim()
          if (!name) return
          await this.provider.createFolder(
            currentFolderId ? S3.keyOf(currentFolderId) : null,
            name,
          )
          uppy.info(this.i18n('folderCreated', { name }), 'info', 3000)
        },
      },
    ]
  }

  install() {
    const enableActions = this.opts.enableActions !== false
    this.view = new ProviderViews(this, {
      provider: this.provider,
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      actions: [
        ...(enableActions ? this.builtInActions() : []),
        ...(this.opts.actions ?? []),
      ],
      toolbarActions: [
        ...(enableActions ? this.builtInToolbarActions() : []),
        ...(this.opts.toolbarActions ?? []),
      ],
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

    if (this.opts.keepStateOnClose) {
      // ProviderViews resets its state when the Dashboard panel closes; a
      // management UI wants to come back to the same folder instead.
      this.uppy.off('dashboard:close-panel', this.view.resetPluginState)
    }

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }

    this.#checkStoredSession()
  }

  uninstall() {
    this.view.tearDown()
    this.unmount()
  }

  render(state: unknown): ComponentChild {
    if (!this.#sessionChecked) {
      return <div className="uppy-Provider-loading">{this.i18n('loading')}</div>
    }
    this.#maybeAutoConnect()
    return this.view.render(state)
  }

  /**
   * A Companion session persisted by an earlier visit may belong to a different
   * bucket than the one configured now (tenant switch, changed prefix). Drop it
   * before the first listing so auto-connect signs in to the configured bucket
   * instead of silently showing the old one.
   */
  async #checkStoredSession(): Promise<void> {
    const { bucket } = this.opts
    if (bucket) {
      try {
        const [token, storedBucket] = await Promise.all([
          this.storage.getItem(this.provider.tokenKey),
          this.storage.getItem(this.#bucketStorageKey),
        ])
        if (token && storedBucket !== bucket) {
          this.uppy.log(
            `[S3] stored session is for "${storedBucket ?? 'an unknown bucket'}", reconnecting to "${bucket}"`,
          )
          await this.provider.logout()
        }
      } catch (err) {
        this.uppy.log(
          `[S3] could not check the stored session: ${err instanceof Error ? err.message : String(err)}`,
          'warning',
        )
      }
    }
    this.#sessionChecked = true
    // Re-render now that the view may proceed.
    this.setPluginState({})
  }

  /** Skip the auth form when the integrator already told us which bucket to open. */
  #maybeAutoConnect(): void {
    const { bucket, autoConnect } = this.opts
    if (this.#autoConnectAttempted || autoConnect === false || !bucket) return
    const { authenticated, didFirstRender } = this.getPluginState()
    if (!didFirstRender || authenticated !== false) return
    this.#autoConnectAttempted = true
    this.view.handleAuth({ bucket }).catch((err: unknown) => {
      this.uppy.log(
        `[S3] auto-connect failed: ${err instanceof Error ? err.message : String(err)}`,
        'warning',
      )
    })
  }
}

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    S3: S3<M, B>
  }
}
