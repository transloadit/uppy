import {
  decodeStorageGrant,
  normalizeStorageGrantPrefix,
  type StorageGrantClaims,
} from '@transloadit/utils'
import type {
  AsyncStore,
  Body,
  Meta,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { UIPlugin, UserFacingApiError } from '@uppy/core'
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
} from '@uppy/core/provider-views'
import type { I18n, LocaleStrings } from '@uppy/core/utils'
// biome-ignore lint/style/useImportType: h is not a type
import { type ComponentChild, h } from '@uppy/core/utils/preact'
// Load Dashboard's event augmentation without adding a runtime dependency.
import type {} from '@uppy/dashboard'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import moveFolder, { deleteFolder } from './moveFolder.js'
import StorageIcon from './StorageIcon.js'

/** Unverified claims of a storage grant (the client only needs to *read* them). */
export type S3GrantClaims = Pick<
  StorageGrantClaims,
  'bucket' | 'prefix' | 'scopes'
> & { exp?: number }

/** What a listing tells the client about the session it was served for. */
export type S3Session = {
  /** Bucket the session is browsing. */
  bucket: string
  /** Key prefix the session is rooted at: `''` or ending with `/`. */
  prefix: string
  /** Companion allows this session to change files. */
  canWrite: boolean
  /** Companion moves a whole folder itself; otherwise the client walks it. */
  supportsMoveFolder: boolean
}

/**
 * Reads the payload of a JWT grant without verifying it — verification is
 * Companion's job; the client only uses the claims to know what UI to show.
 */
export function decodeGrant(grant: string): S3GrantClaims | null {
  return decodeStorageGrant(grant)
}

class S3SimpleAuthProvider<M extends Meta, B extends Body> extends Provider<
  M,
  B
> {
  /** Called after a successful simple-auth with the form data that was sent. */
  onSimpleAuth?: (authFormData: unknown) => Promise<void>

  /** Called with what every listing reports about the session. */
  onSession?: (session: S3Session) => void

  /** Bucket of the session, as the latest listing reported it. */
  #bucket: string | undefined

  override async list<ResBody>(
    ...args: Parameters<Provider<M, B>['list']>
  ): Promise<ResBody> {
    const response = await super.list<ResBody>(...args)
    // The wire shape is `ProviderListResponse['session']` on the Companion side.
    const { session } = (response ?? {}) as { session?: Partial<S3Session> }
    if (typeof session?.bucket === 'string') this.#bucket = session.bucket
    this.onSession?.({
      bucket: session?.bucket ?? '',
      prefix: session?.prefix ?? '',
      canWrite: session?.canWrite === true,
      supportsMoveFolder: session?.supportsMoveFolder === true,
    })
    return response
  }

  /**
   * A queued import outlives the session that selected it: pin the bucket the
   * file was listed in, so Companion can refuse to read the same key from
   * whatever bucket a later session happens to see.
   */
  override fileUrl(id: string): string {
    if (!this.#bucket)
      throw new Error('Browse the storage folder before selecting files.')
    const url = new URL(super.fileUrl(id))
    url.searchParams.set('bucket', this.#bucket)
    return url.href
  }

  /** Mints a server-issued grant; set by the plugin when `getGrant` is configured. */
  getGrant?: () => Promise<string>

  #regranting: Promise<void> | undefined

  /** Aborts everything belonging to the session that `logout()` ended. */
  #sessionAbort = new AbortController()

  #tokenWrites: Promise<void> = Promise.resolve()

  override async setAuthToken(token: string): Promise<void> {
    const signal = this.#sessionAbort.signal
    // Serialize async storage writes with logout's removal; a late write cannot
    // resurrect a token of a session that ended in the meantime.
    const write = this.#tokenWrites
      .catch(() => {})
      .then(async () => {
        signal.throwIfAborted()
        await super.setAuthToken(token)
      })
    this.#tokenWrites = write
    await write
  }

  protected override async removeAuthToken(): Promise<void> {
    const write = this.#tokenWrites
      .catch(() => {})
      .then(() => super.removeAuthToken())
    this.#tokenWrites = write
    await write
  }

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
    if (this.#sessionAbort.signal.aborted)
      this.#sessionAbort = new AbortController()
    signal = AbortSignal.any([signal, this.#sessionAbort.signal])
    // The client cannot pick a bucket: it asks for a session, with a grant when
    // the integrator mints one, and Companion decides what it sees.
    const form = isFormWithCredentials(authFormData)
      ? authFormData
      : this.getGrant
        ? { grant: await this.getGrant() }
        : {}
    signal.throwIfAborted()
    await this.loginSimpleAuth({ uppyVersions, authFormData: form, signal })
    signal.throwIfAborted()
    await this.onSimpleAuth?.(form)
    signal.throwIfAborted()
    this.#hasSession = true
  }

  /**
   * Grants are short-lived: when Companion answers 401 mid-session, fetch a
   * fresh grant once and retry the request instead of bouncing the user to
   * the connect screen.
   */
  protected override async request<ResBody>(
    ...args: Parameters<Provider<M, B>['request']>
  ): Promise<ResBody> {
    const sessionSignal = this.#sessionAbort.signal
    const [options] = args
    const signal = options.signal
      ? AbortSignal.any([options.signal, sessionSignal])
      : sessionSignal
    try {
      const result = await super.request<ResBody>({ ...options, signal })
      sessionSignal.throwIfAborted()
      return result
    } catch (err) {
      sessionSignal.throwIfAborted()
      const [{ path }] = args
      const isAuthError = (err as { isAuthError?: boolean }).isAuthError
      // Without a session there is nothing to refresh: a 401 on the initial
      // listing is ProviderViews probing for one (only happens when the plugin
      // is not auto-connecting) and must reach it so the connect UI shows.
      if (
        !isAuthError ||
        !this.getGrant ||
        (!this.#hasSession && !this.#regranting) ||
        path.endsWith('/simple-auth')
      ) {
        throw err
      }
      if (this.#regranting == null) {
        // Many requests may fail at once; mint one grant for all of them. The
        // renewal is shared, so it must not inherit one caller's abort signal.
        const renewal = (async () => {
          await this.removeAuthToken()
          sessionSignal.throwIfAborted()
          await this.login({
            authFormData: {},
            signal: new AbortController().signal,
          })
        })().finally(() => {
          if (this.#regranting === renewal) this.#regranting = undefined
        })
        this.#regranting = renewal
      }
      await this.#regranting
      sessionSignal.throwIfAborted()
      return await super.request<ResBody>({ ...options, signal })
    }
  }

  async logout<ResBody>(): Promise<ResBody> {
    this.#sessionAbort.abort()
    this.#regranting = undefined
    this.#bucket = undefined
    this.#hasSession = false
    await this.removeAuthToken()
    return {
      ok: true,
      revoked: true,
    } as unknown as ResBody
  }
}

const isFormWithCredentials = (data: unknown): data is { grant: string } =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as { grant?: unknown }).grant === 'string'

/**
 * The connect screen: Companion decides which bucket the session sees (its own
 * configuration, or the grant), so there is nothing to type — one button, which
 * also remains as a retry while auto-connect runs.
 */
const ConnectAuthForm = ({
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

export type S3Options<
  M extends Meta = Meta,
  B extends Body = Body,
> = CompanionPluginOptions & {
  locale?: LocaleStrings<typeof locale>
  /**
   * Show management actions (rename/move, delete, new folder). Requires a
   * Companion whose S3 provider allows mutations. Default: true.
   */
  enableActions?: boolean
  /** Extra per-item actions, appended to the built-in ones. */
  actions?: ProviderAction<M, B>[]
  /** Extra toolbar actions, appended to the built-in ones. */
  toolbarActions?: ProviderToolbarAction<M, B>[]
  /**
   * Connect without showing the connect screen whenever no Companion session
   * is stored yet. Default: true.
   */
  autoConnect?: boolean
  /**
   * Keep the browsing state (current folder, loaded tree) when the Dashboard
   * panel closes, instead of resetting to the root like pickers do. Useful for
   * management UIs that return to the same folder after an upload. Default: false.
   */
  keepStateOnClose?: boolean
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
  bulkActions?: ProviderBulkAction<M, B>[]
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
 * Wraps an action's `run` so it only has to return the success toast; an action
 * that returns nothing did nothing (a cancelled prompt) and says so with
 * `false`, which keeps ProviderView from refreshing the listing. Errors keep
 * going through ProviderView.
 */
const withToast =
  <Ctx extends { uppy: Uppy<any, any> }>(
    run: (context: Ctx) => Promise<string | undefined>,
  ) =>
  async (context: Ctx): Promise<void | false> => {
    const message = await run(context)
    if (!message) return false
    context.uppy.info(message, 'info', 3000)
  }

export default class S3<M extends Meta, B extends Body>
  extends UIPlugin<S3Options<M, B>, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  /** Companion provider this plugin talks to; subclasses point at their own. */
  protected get providerName(): string {
    return 's3'
  }

  icon: () => h.JSX.Element

  provider: S3SimpleAuthProvider<M, B>

  view!: ProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  rootFolderId: string | null = null

  #autoConnectAttempted = false

  /** False until we know whether a Companion session is stored. */
  #sessionChecked = false

  /** Resolves once that check is done. */
  #sessionReady: Promise<void> | undefined

  /** Claims of the grant the current session was opened with, if any. */
  #grant: S3GrantClaims | null = null

  /** What the latest listing reported about the session; `undefined` until the first one. */
  #session: S3Session | undefined

  /** True when no usable Companion session is stored, so auto-connect must log in first. */
  #needsLogin = false

  constructor(uppy: Uppy<M, B>, opts: S3Options<M, B>) {
    super(uppy, opts)
    this.id = this.opts.id || 'S3'
    this.type = 'acquirer'
    this.files = []
    this.storage = this.opts.storage || tokenStorage

    this.defaultLocale = locale
    this.i18nInit()
    this.title = this.i18n('pluginNameS3')
    this.icon = () => <StorageIcon className="uppy-DashboardTab-iconS3" />

    this.provider = new S3SimpleAuthProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: this.providerName,
      pluginId: this.id,
      supportsRefreshToken: false,
    })
    this.provider.getGrant = this.opts.getGrant
    this.provider.onSession = (session) => {
      this.#session = session
      this.#applyActions()
    }
    this.provider.onSimpleAuth = async (authFormData) => {
      if (!isFormWithCredentials(authFormData)) return
      this.#grant = decodeGrant(authFormData.grant)
      this.#applyActions()
    }

    this.render = this.render.bind(this)
  }

  /** The S3 object key behind a partial-tree item id (ids are URL-encoded keys). */
  static keyOf(id: string): string {
    return decodeURIComponent(id)
  }

  /**
   * Opens the folder at `key` (e.g. `docs/photos/`), walking down from the
   * browsing root so each parent listing reveals the next segment — loading
   * further pages when a segment is not on the first one. Returns false when a
   * segment no longer exists, or when the key is outside the session's root:
   * the view then stays where the walk got to (useful for restoring stale deep
   * links).
   */
  async openFolderPath(key: string | null): Promise<boolean> {
    await this.#sessionReady
    // This call owns the initial navigation even without a rendered panel:
    // prevent a later first render from reopening the root behind our back.
    this.#autoConnectAttempted = true
    this.setPluginState({ didFirstRender: true })
    await this.#settledListing()
    if (!this.getPluginState().authenticated && this.#needsLogin) {
      // The client has nothing to fill in: Companion (or the grant) decides
      // which bucket the session sees.
      await this.view.handleAuth({})
      if (!this.getPluginState().authenticated) return false
    }
    // Without a grant only a listing tells us which prefix the session is
    // rooted at, so make sure we have had one before judging the key.
    if (!this.#grant && this.#session === undefined) {
      await this.view.openFolder(this.rootFolderId)
    }
    const root = this.rootPrefix
    const prefix = key ? (key.endsWith('/') ? key : `${key}/`) : root
    if (
      !prefix.startsWith(root) ||
      prefix.split('/').some((segment) => segment === '..' || segment === '.')
    )
      return false
    await this.view.openFolder(this.rootFolderId)
    let path = root
    for (const segment of prefix
      .slice(root.length)
      .split('/')
      .filter(Boolean)) {
      path += `${segment}/`
      const folderId = encodeURIComponent(path)
      while (
        !this.getPluginState().partialTree.some(
          (node) => node.id === folderId && node.type === 'folder',
        )
      ) {
        if (!(await this.view.loadNextPage())) return false
      }
      await this.view.openFolder(folderId)
    }
    return true
  }

  /** Resolves once no listing request is in flight. */
  async #settledListing(): Promise<void> {
    if (!this.getPluginState().loading) return
    await new Promise<void>((resolve) => {
      const changed = () => {
        if (this.getPluginState().loading) return
        this.uppy.off('state-update', changed)
        resolve()
      }
      this.uppy.on('state-update', changed)
      changed()
    })
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
    if (!this.canWrite) return []
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
          // A bare name renames in place; a path is relative to the browsing
          // root the session is scoped to.
          const isMove = value.includes('/')
          let destination = isMove
            ? `${this.rootPrefix}${value}`
            : `${parent}${value}`
          if (isFolder && !destination.endsWith('/')) destination += '/'
          if (destination === key) return undefined
          await view.runWithProgress(({ signal, setProgress }) =>
            this.#move(key, destination, isFolder, {
              signal,
              onProgress: (done, total) =>
                setProgress(this.i18n('movingFiles', { done, total })),
            }),
          )
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
          await view.runWithProgress(({ signal, setProgress }) =>
            this.#delete(key, {
              signal,
              onProgress: (done, total) =>
                setProgress(this.i18n('deletingFiles', { done, total })),
            }),
          )
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

  /** Both the session and Companion must allow changes; older servers fail closed. */
  get canWrite(): boolean {
    return (
      (this.#session?.canWrite ?? false) &&
      (this.#grant?.scopes.includes('write') ?? true)
    )
  }

  /**
   * Root the session browses, which paths typed into the UI are relative to:
   * the grant's prefix, or what the latest listing reported. The server still
   * enforces it — this only decides what the UI builds.
   */
  get rootPrefix(): string {
    if (this.#grant) return normalizeStorageGrantPrefix(this.#grant.prefix)
    return this.#session?.prefix ?? ''
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
              confirmLabel: this.i18n('move'),
            })
          )
            ?.trim()
            .replace(/^\/+/, '')
          if (destination === undefined || destination === null)
            return undefined
          const relativeFolder =
            destination === '' || destination.endsWith('/')
              ? destination
              : `${destination}/`
          // Typed destinations are relative to the browsing root.
          const folder = `${this.rootPrefix}${relativeFolder}`
          // ProviderView hands us the top-most selected items only: moving a
          // folder covers everything under it.
          const keys = items.map((item) => S3.keyOf(item.id))
          await view.runWithProgress(async ({ signal, setProgress }) => {
            for (const [index, key] of keys.entries()) {
              setProgress(
                this.i18n('movingItems', {
                  done: index + 1,
                  total: keys.length,
                }),
              )
              const { name, isFolder } = splitKey(key)
              await this.#move(
                key,
                `${folder}${name}${isFolder ? '/' : ''}`,
                isFolder,
                { signal },
              )
            }
          })
          return this.i18n('itemsMoved', { smart_count: keys.length })
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
          await view.runWithProgress(async ({ signal, setProgress }) => {
            for (const [index, item] of items.entries()) {
              setProgress(
                this.i18n('deletingItems', {
                  done: index + 1,
                  total: items.length,
                }),
              )
              await this.#delete(S3.keyOf(item.id), { signal })
            }
          })
          return this.i18n('itemsDeleted', { smart_count: items.length })
        }),
      },
    ]
  }

  /**
   * Moves one item. The generic S3 provider only moves files: a folder is a key
   * prefix, so the client walks it and moves its files one by one (see
   * `moveFolder`). Backends that move a whole subtree themselves override this.
   */
  async #move(
    key: string,
    destination: string,
    isFolder: boolean,
    {
      signal,
      onProgress,
    }: {
      signal?: AbortSignal | undefined
      onProgress?: ((done: number, total: number) => void) | undefined
    } = {},
  ): Promise<void> {
    if (!isFolder) {
      await this.provider.moveItem(key, destination, { signal })
      return
    }
    if (destination.startsWith(key)) {
      // The same locale key Companion answers with; `ProviderView` translates it.
      throw new UserFacingApiError('s3FolderIntoItself')
    }
    if (this.#session?.supportsMoveFolder) {
      // The backend moves the whole folder in one call (Transloadit Storage
      // does, preserving asset identity); nothing to walk.
      await this.provider.moveItem(key, destination, { signal })
      return
    }
    await moveFolder({
      provider: this.provider,
      source: key,
      target: destination,
      signal,
      onProgress,
      log: (message) => this.uppy.log(`[S3] ${message}`),
    })
  }

  /**
   * Deletes one item. Companion only deletes a folder once it is empty, so a
   * folder is walked and emptied first (see `deleteFolder`).
   */
  async #delete(
    key: string,
    {
      signal,
      onProgress,
    }: {
      signal?: AbortSignal | undefined
      onProgress?: ((done: number, total: number) => void) | undefined
    } = {},
  ): Promise<void> {
    if (!key.endsWith('/')) {
      await this.provider.deleteItem(key, { signal })
      return
    }
    await deleteFolder({
      provider: this.provider,
      folder: key,
      signal,
      onProgress,
      log: (message) => this.uppy.log(`[S3] ${message}`),
    })
  }

  /** (Re)compute the actions: the integrator's switch, and what the session may do. */
  #applyActions(): void {
    const enableActions = this.opts.enableActions !== false
    this.view.opts.actions = [
      ...(enableActions ? this.builtInActions() : []),
      ...(this.opts.actions ?? []),
    ]
    this.view.opts.toolbarActions = [
      ...(enableActions && this.canWrite ? this.builtInToolbarActions() : []),
      ...(this.opts.toolbarActions ?? []),
    ]
    this.view.opts.bulkActions = [
      ...(enableActions && this.canWrite ? this.builtInBulkActions() : []),
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
      standalone: this.opts.standalone,
      getPreviewUrl: getPreviewUrl
        ? (item) => getPreviewUrl(S3.keyOf(item.id))
        : undefined,
      // Use the plugin's own i18n (which includes our defaultLocale) rather than
      // the core one that ProviderViews hands us, so the label resolves even
      // when the integrator does not load @uppy/locales.
      renderAuthForm: ({ onAuth }) => (
        <ConnectAuthForm onAuth={onAuth} i18n={this.i18n} />
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

    this.#sessionReady = this.#checkStoredSession()
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
   * Find out whether a usable Companion session is stored, so auto-connect
   * knows whether it has to log in before the first listing.
   */
  async #checkStoredSession(): Promise<void> {
    const { getGrant } = this.opts
    try {
      const token = await this.storage.getItem(this.provider.tokenKey)
      if (getGrant) {
        // Grants are short-lived and scoped to whoever is logged in now: never
        // reuse a session persisted by an earlier visit.
        this.#needsLogin = true
        if (token) await this.provider.logout()
      } else {
        this.#needsLogin = !token
      }
    } catch (err) {
      this.#warn('could not check the stored session', err)
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
    return (
      !this.#autoConnectAttempted &&
      this.opts.autoConnect !== false &&
      this.#needsLogin
    )
  }

  #preAuthenticate(): void {
    this.#autoConnectAttempted = true
    // Mark the probing render as done; handleAuth lists the root itself.
    this.setPluginState({ didFirstRender: true })
    this.view
      .handleAuth({})
      .catch((err: unknown) => this.#warn('auto-connect failed', err))
  }

  /**
   * Skip the connect screen when a stored session turned out to be invalid
   * after all.
   */
  #maybeAutoConnect(): void {
    if (this.#autoConnectAttempted || this.opts.autoConnect === false) return
    const { authenticated, didFirstRender } = this.getPluginState()
    if (!didFirstRender || authenticated !== false) return
    this.#autoConnectAttempted = true
    this.view
      .handleAuth({})
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
