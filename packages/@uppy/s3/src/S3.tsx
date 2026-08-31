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
  type ProviderBulkAction,
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

/** Unverified claims of a storage grant (the client only needs to *read* them). */
export type S3GrantClaims = {
  bucket: string
  prefix: string
  scopes: ('read' | 'write')[]
  exp?: number
}

/**
 * Reads the payload of a JWT grant without verifying it — verification is
 * Companion's job; the client only uses the claims to know what UI to show.
 */
export function decodeGrant(grant: string): S3GrantClaims | null {
  try {
    const payload = grant.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as Partial<S3GrantClaims>
    if (typeof claims.bucket !== 'string') return null
    return {
      bucket: claims.bucket,
      prefix: typeof claims.prefix === 'string' ? claims.prefix : '',
      scopes: Array.isArray(claims.scopes) ? claims.scopes : ['read', 'write'],
      ...(typeof claims.exp === 'number' && { exp: claims.exp }),
    }
  } catch {
    return null
  }
}

class S3SimpleAuthProvider<M extends Meta, B extends Body> extends Provider<
  M,
  B
> {
  /** Called after a successful simple-auth with the form data that was sent. */
  onSimpleAuth?: (authFormData: unknown) => Promise<void>

  /** Mints a server-issued grant; set by the plugin when `getGrant` is configured. */
  getGrant?: () => Promise<string>

  #regranting: Promise<void> | undefined

  /** True between a successful login and a logout: only then is a 401 an *expired* session. */
  #hasSession = false

  async login({
    authFormData,
    uppyVersions = '',
    signal,
  }: {
    uppyVersions?: string
    authFormData: unknown
    signal: AbortSignal
  }) {
    const form = isFormWithCredentials(authFormData)
      ? authFormData
      : this.getGrant
        ? { grant: await this.getGrant() }
        : authFormData
    await this.loginSimpleAuth({ uppyVersions, authFormData: form, signal })
    this.#hasSession = true
    await this.onSimpleAuth?.(form)
  }

  /**
   * Grants are short-lived: when Companion answers 401 mid-session, fetch a
   * fresh grant once and retry the request instead of bouncing the user to
   * the connect screen.
   */
  protected override async request<ResBody>(
    ...args: Parameters<Provider<M, B>['request']>
  ): Promise<ResBody> {
    try {
      return await super.request<ResBody>(...args)
    } catch (err) {
      const [{ path, signal }] = args
      const isAuthError = (err as { isAuthError?: boolean }).isAuthError
      // Without a session there is nothing to refresh: a 401 on the initial
      // listing is ProviderViews probing for one (only happens when the plugin
      // is not auto-connecting) and must reach it so the connect UI shows.
      if (
        !isAuthError ||
        !this.getGrant ||
        !this.#hasSession ||
        path.endsWith('/simple-auth')
      ) {
        throw err
      }
      if (this.#regranting == null) {
        // Many requests may fail at once; mint one grant for all of them.
        this.#regranting = (async () => {
          this.#hasSession = false
          await this.removeAuthToken()
          await this.login({
            authFormData: {},
            signal: signal ?? new AbortController().signal,
          })
        })().finally(() => {
          this.#regranting = undefined
        })
      }
      await this.#regranting
      return await super.request<ResBody>(...args)
    }
  }

  async logout<ResBody>(): Promise<ResBody> {
    this.#hasSession = false
    await this.removeAuthToken()
    return {
      ok: true,
      revoked: true,
    } as unknown as ResBody
  }
}

const isFormWithCredentials = (
  data: unknown,
): data is { bucket?: string; grant?: string } =>
  typeof data === 'object' &&
  data !== null &&
  (typeof (data as { bucket?: unknown }).bucket === 'string' ||
    typeof (data as { grant?: unknown }).grant === 'string')

/** Shown while a server-issued grant connects; a button remains for retries. */
const GrantAuthForm = ({
  i18n,
  onAuth,
}: {
  i18n: I18n
  onAuth: (arg: Record<string, never>) => void
}) => (
  <div className="uppy-Provider-auth">
    <button
      type="button"
      className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn"
      onClick={() => onAuth({})}
    >
      {i18n('authenticate')}
    </button>
  </div>
)

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
   * "Connect". Development / single-tenant use; Companions configured with a
   * grant secret refuse it.
   */
  bucket?: string
  /**
   * Fetch a server-issued storage grant (a short-lived JWT your backend mints
   * after authenticating the user, scoped to a bucket, prefix and
   * `read`/`write`). The plugin connects with it automatically, hides the
   * mutation actions when the grant is read-only, and fetches a new one when
   * Companion reports the session expired.
   */
  getGrant?: () => Promise<string>
  /**
   * The plugin is the whole page (a file library), not a picker inside the
   * Dashboard: the panel header shows just the plugin title instead of
   * "Import from …" and has no Cancel button. Default: false.
   */
  standalone?: boolean
  /**
   * 'picker' (default): rows are checkboxes and the selection is added to
   * Uppy. 'manager' (file-library UIs): clicking a file opens its detail
   * modal, multi-select hides behind an explicit toggle, and the selection
   * feeds bulk actions (delete, move) instead of picking.
   */
  mode?: 'picker' | 'manager'
  /**
   * Manager mode: resolves a preview image URL for a file's detail modal
   * (e.g. a signed thumbnail URL your server produces for the key).
   */
  getPreviewUrl?: (key: string) => Promise<string>
  /** Manager mode: extra bulk actions, appended to the built-in ones. */
  bulkActions?: ProviderBulkAction<any, any>[]
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

/**
 * Wraps an action's `run` so it only has to return the success toast (or
 * nothing when the user cancelled); errors keep going through ProviderView.
 */
const withToast =
  <Ctx extends { uppy: Uppy<any, any> }>(
    run: (context: Ctx) => Promise<string | undefined>,
  ) =>
  async (context: Ctx): Promise<void> => {
    const message = await run(context)
    if (message) context.uppy.info(message, 'info', 3000)
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

  /** Claims of the grant the current session was opened with, if any. */
  #grant: S3GrantClaims | null = null

  /** True when no usable Companion session is stored, so auto-connect must log in first. */
  #needsLogin = false

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
    this.provider.getGrant = this.opts.getGrant
    this.provider.onSimpleAuth = async (authFormData) => {
      if (!isFormWithCredentials(authFormData)) return
      if (typeof authFormData.grant === 'string') {
        this.#grant = decodeGrant(authFormData.grant)
        this.#applyActions()
      } else if (typeof authFormData.bucket === 'string') {
        await this.storage.setItem(this.#bucketStorageKey, authFormData.bucket)
      }
    }

    this.render = this.render.bind(this)
  }

  /** The S3 object key behind a partial-tree item id (ids are URL-encoded keys). */
  static keyOf(id: string): string {
    return decodeURIComponent(id)
  }

  /**
   * Re-list the folder that is open — e.g. after uploads that happened
   * outside the browser panel (an app-owned upload modal). Busts the
   * folder cache, unlike openFolder().
   */
  async refreshListing(): Promise<void> {
    await this.view.refreshCurrentFolder()
  }

  builtInActions(): ProviderAction<M, B>[] {
    return [
      {
        id: 's3:rename',
        label: this.i18n('renameOrMove'),
        appliesTo: 'all',
        run: withToast(async ({ item, view }) => {
          const key = S3.keyOf(item.id)
          const { parent, name, isFolder } = splitKey(key)
          const input = await view.prompt({
            title: this.i18n('renameOrMoveTitle', { name }),
            label: this.i18n('renameOrMovePrompt'),
            defaultValue: name,
            confirmLabel: this.i18n('rename'),
          })
          const value = input?.trim().replace(/^\/+/, '')
          if (!value) return undefined
          // A bare name renames in place; anything with a "/" is a full key (move).
          const isMove = value.includes('/')
          let destination = isMove ? value : `${parent}${value}`
          if (isFolder && !destination.endsWith('/')) destination += '/'
          if (destination === key) return undefined
          await this.provider.moveItem(key, destination)
          return isMove
            ? this.i18n('itemMoved', { path: destination })
            : this.i18n('itemRenamed', { name: value })
        }),
      },
      {
        id: 's3:delete',
        label: this.i18n('deleteItem'),
        danger: true,
        appliesTo: 'all',
        run: withToast(async ({ item, view }) => {
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
          if (!confirmed) return undefined
          await this.provider.deleteItem(key)
          return this.i18n('itemDeleted', { name })
        }),
      },
    ]
  }

  builtInToolbarActions(): ProviderToolbarAction<M, B>[] {
    return [
      {
        id: 's3:newFolder',
        label: this.i18n('newFolder'),
        run: withToast(async ({ currentFolderId, view }) => {
          const name = (
            await view.prompt({
              title: this.i18n('newFolder'),
              label: this.i18n('newFolderPrompt'),
              confirmLabel: this.i18n('create'),
            })
          )?.trim()
          if (!name) return undefined
          await this.provider.createFolder(
            currentFolderId ? S3.keyOf(currentFolderId) : null,
            name,
          )
          return this.i18n('folderCreated', { name })
        }),
      },
    ]
  }

  /** Whether the current session may change files (bucket sessions always may). */
  get canMutate(): boolean {
    return this.#grant ? this.#grant.scopes.includes('write') : true
  }

  /** Bulk actions over the multi-selection in manager mode. */
  builtInBulkActions(): ProviderBulkAction<M, B>[] {
    return [
      {
        id: 's3:bulkMove',
        label: this.i18n('moveSelected'),
        run: withToast(async ({ items, view }) => {
          const destination = (
            await view.prompt({
              title: this.i18n('moveSelected'),
              label: this.i18n('moveSelectedPrompt'),
              confirmLabel: this.i18n('moveSelected').replace(/…$/, ''),
            })
          )
            ?.trim()
            .replace(/^\/+/, '')
          if (destination === undefined || destination === null)
            return undefined
          const folder =
            destination === '' || destination.endsWith('/')
              ? destination
              : `${destination}/`
          for (const item of items) {
            const key = S3.keyOf(item.id)
            const { name, isFolder } = splitKey(key)
            await this.provider.moveItem(
              key,
              `${folder}${name}${isFolder ? '/' : ''}`,
            )
          }
          return this.i18n('itemsMoved', { smart_count: items.length })
        }),
      },
      {
        id: 's3:bulkDelete',
        label: this.i18n('deleteItem'),
        danger: true,
        run: withToast(async ({ items, view }) => {
          const confirmed = await view.confirm({
            title: this.i18n('deleteSelectedConfirm', {
              smart_count: items.length,
            }),
            confirmLabel: this.i18n('deleteItem'),
            danger: true,
          })
          if (!confirmed) return undefined
          for (const item of items) {
            await this.provider.deleteItem(S3.keyOf(item.id))
          }
          return this.i18n('itemsDeleted', { smart_count: items.length })
        }),
      },
    ]
  }

  /** (Re)compute the actions: the integrator's switch, and the grant's scopes. */
  #applyActions(): void {
    const enableActions = this.opts.enableActions !== false && this.canMutate
    this.view.opts.actions = [
      ...(enableActions ? this.builtInActions() : []),
      ...(this.opts.actions ?? []),
    ]
    this.view.opts.toolbarActions = [
      ...(enableActions ? this.builtInToolbarActions() : []),
      ...(this.opts.toolbarActions ?? []),
    ]
    this.view.opts.bulkActions = [
      ...(enableActions ? this.builtInBulkActions() : []),
      ...(this.opts.bulkActions ?? []),
    ]
    this.setPluginState({})
  }

  install() {
    const { getPreviewUrl } = this.opts
    this.view = new ProviderViews(this, {
      provider: this.provider,
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      mode: this.opts.mode,
      getPreviewUrl: getPreviewUrl
        ? (item) => getPreviewUrl(S3.keyOf(item.id))
        : undefined,
      // Use the plugin's own i18n (which includes our defaultLocale) rather than
      // the core one that ProviderViews hands us, so the label resolves even
      // when the integrator does not load @uppy/locales.
      renderAuthForm: ({ onAuth }) =>
        this.opts.getGrant ? (
          <GrantAuthForm onAuth={onAuth} i18n={this.i18n} />
        ) : (
          <AuthForm
            onAuth={onAuth}
            i18n={this.i18n}
            defaultBucket={this.opts.bucket}
          />
        ),
    })
    this.#applyActions()

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
    if (this.#shouldPreAuthenticate()) {
      this.#preAuthenticate()
    } else {
      this.#maybeAutoConnect()
    }
    return this.view.render(state)
  }

  /**
   * A Companion session persisted by an earlier visit may belong to a different
   * bucket than the one configured now (tenant switch, changed prefix). Drop it
   * before the first listing so auto-connect signs in to the configured bucket
   * instead of silently showing the old one.
   */
  async #checkStoredSession(): Promise<void> {
    const { bucket, getGrant } = this.opts
    if (getGrant) {
      // Grants are short-lived and scoped to whoever is logged in now: never
      // reuse a session persisted by an earlier visit.
      this.#needsLogin = true
      try {
        if (await this.storage.getItem(this.provider.tokenKey)) {
          await this.provider.logout()
        }
      } catch (err) {
        this.#warn('could not drop the stored session', err)
      }
    } else if (bucket) {
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
          this.#needsLogin = true
        } else if (!token) {
          this.#needsLogin = true
        }
      } catch (err) {
        this.#warn('could not check the stored session', err)
      }
    }
    this.#sessionChecked = true
    // Re-render now that the view may proceed.
    this.setPluginState({})
  }

  /**
   * Whether to log in before ProviderViews renders for the first time. Its
   * first render probes for a session with an unauthenticated listing — a 401
   * by design — which is wasted (and logged by browsers) when we already know
   * there is no session and how to open one.
   */
  #shouldPreAuthenticate(): boolean {
    const { bucket, getGrant, autoConnect } = this.opts
    return (
      !this.#autoConnectAttempted &&
      autoConnect !== false &&
      this.#needsLogin &&
      Boolean(bucket || getGrant)
    )
  }

  #preAuthenticate(): void {
    const { bucket, getGrant } = this.opts
    this.#autoConnectAttempted = true
    // Mark the probing render as done; handleAuth lists the root itself.
    this.setPluginState({ didFirstRender: true })
    this.view
      .handleAuth(getGrant ? {} : { bucket })
      .catch((err: unknown) => this.#warn('auto-connect failed', err))
  }

  /**
   * Skip the auth form when the integrator already told us how to connect and
   * a stored session turned out to be invalid after all.
   */
  #maybeAutoConnect(): void {
    const { bucket, getGrant, autoConnect } = this.opts
    if (this.#autoConnectAttempted || autoConnect === false) return
    if (!bucket && !getGrant) return
    const { authenticated, didFirstRender } = this.getPluginState()
    if (!didFirstRender || authenticated !== false) return
    this.#autoConnectAttempted = true
    this.view
      .handleAuth(getGrant ? {} : { bucket })
      .catch((err: unknown) => this.#warn('auto-connect failed', err))
  }

  #warn(what: string, err: unknown): void {
    const reason = err instanceof Error ? err.message : String(err)
    this.uppy.log(`[S3] ${what}: ${reason}`, 'warning')
  }
}

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    S3: S3<M, B>
  }
}
