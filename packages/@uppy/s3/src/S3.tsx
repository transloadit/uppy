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
import { asFolderKey, splitKey } from './keys.js'
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

/** What a long write operation gets from `ProviderView.runWithProgress`. */
type OperationOptions = {
  signal: AbortSignal
  onProgress: (done: number, total: number) => void
}

class S3SimpleAuthProvider<M extends Meta, B extends Body> extends Provider<
  M,
  B
> {
  /** Mints a server-issued grant; set by the plugin when `getGrant` is configured. */
  getGrant?: () => Promise<string>

  /** Called after a successful login with the grant it sent, if any. */
  onLogin?: (grant: string | undefined) => void

  /** Called with what every listing reports about the session. */
  onSession?: (session: S3Session) => void

  /** Called when the session ends (`logout()`), before the token is removed. */
  onLogout?: () => void

  /** Bucket of the session, as the latest listing reported it. */
  #bucket: string | undefined

  /** True between a successful login and a logout: only then is a 401 an *expired* session. */
  #hasSession = false

  #regranting: Promise<void> | undefined

  /** Aborts everything belonging to the session that `logout()` ended. */
  #sessionAbort = new AbortController()

  #tokenWrites: Promise<void> = Promise.resolve()

  override async list<ResBody>(
    ...args: Parameters<Provider<M, B>['list']>
  ): Promise<ResBody> {
    const response = await super.list<ResBody>(...args)
    // The wire shape is `ProviderListResponse['session']` on the Companion side.
    const { session } = response as { session: S3Session }
    this.#bucket = session.bucket
    this.onSession?.(session)
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

  /**
   * Serializes async token storage writes with logout's removal, so a late
   * write cannot resurrect the token of a session that ended in the meantime.
   */
  #queueTokenWrite(write: () => Promise<void>): Promise<void> {
    const queued = this.#tokenWrites.catch(() => {}).then(write)
    this.#tokenWrites = queued
    return queued
  }

  override async setAuthToken(token: string): Promise<void> {
    const signal = this.#sessionAbort.signal
    await this.#queueTokenWrite(async () => {
      signal.throwIfAborted()
      await super.setAuthToken(token)
    })
  }

  protected override async removeAuthToken(): Promise<void> {
    await this.#queueTokenWrite(() => super.removeAuthToken())
  }

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
    const grant = isGrantForm(authFormData)
      ? authFormData.grant
      : await this.getGrant?.()
    signal.throwIfAborted()
    await this.loginSimpleAuth({
      uppyVersions,
      authFormData: grant === undefined ? {} : { grant },
      signal,
    })
    signal.throwIfAborted()
    this.onLogin?.(grant)
    this.#hasSession = true
  }

  /**
   * Grants are short-lived: when Companion answers 401 mid-session, fetch a
   * fresh grant once and retry the request instead of bouncing the user to
   * the connect screen.
   */
  protected override async request<ResBody>(
    options: Parameters<Provider<M, B>['request']>[0],
  ): Promise<ResBody> {
    const sessionSignal = this.#sessionAbort.signal
    const signal = options.signal
      ? AbortSignal.any([options.signal, sessionSignal])
      : sessionSignal
    try {
      const result = await super.request<ResBody>({ ...options, signal })
      sessionSignal.throwIfAborted()
      return result
    } catch (err) {
      sessionSignal.throwIfAborted()
      // Without a session there is nothing to refresh: a 401 on the initial
      // listing is ProviderViews probing for one (only happens when the plugin
      // is not auto-connecting) and must reach it so the connect UI shows.
      if (
        !err?.isAuthError ||
        !this.getGrant ||
        (!this.#hasSession && !this.#regranting) ||
        options.path.endsWith('/simple-auth')
      ) {
        throw err
      }
      this.#regranting ??= this.#regrant(sessionSignal)
      await this.#regranting
      sessionSignal.throwIfAborted()
      return await super.request<ResBody>({ ...options, signal })
    }
  }

  /**
   * Many requests may fail at once; mint one grant for all of them. The
   * renewal is shared, so it must not inherit one caller's abort signal.
   */
  #regrant(sessionSignal: AbortSignal): Promise<void> {
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
    return renewal
  }

  async logout<ResBody>(): Promise<ResBody> {
    this.#sessionAbort.abort()
    this.#regranting = undefined
    this.#bucket = undefined
    this.#hasSession = false
    this.onLogout?.()
    await this.removeAuthToken()
    return {
      ok: true,
      revoked: true,
    } as unknown as ResBody
  }
}

const isGrantForm = (data: unknown): data is { grant: string } =>
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

/** What the user typed as a path: trimmed, and relative (no leading `/`). */
const typedPath = (input: string | null): string | undefined =>
  input?.trim().replace(/^\/+/, '')

/** Progress labels of an operation on one item, or on several (bulk). */
const MOVE_PROGRESS = {
  files: 'movingFiles',
  items: 'movingItems',
  itemFiles: 'movingItemFiles',
} as const
const DELETE_PROGRESS = {
  files: 'deletingFiles',
  items: 'deletingItems',
  itemFiles: 'deletingItemFiles',
} as const

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
    this.provider.onLogin = (grant) => {
      this.#grant = grant === undefined ? null : decodeGrant(grant)
      this.#applyActions()
    }
    this.provider.onSession = (session) => {
      this.#session = session
      this.#applyActions()
    }
    this.provider.onLogout = () => {
      // Nothing from the ended session may inform the next one.
      this.#session = undefined
      this.#grant = null
      this.#needsLogin = true
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
    if (!(await this.#ensureSession())) return false
    const root = this.rootPrefix
    const prefix = key ? asFolderKey(key) : root
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

  /**
   * Makes sure there is a working session whose root is known. The client has
   * nothing to fill in to connect: Companion (or the grant) decides which
   * bucket the session sees.
   */
  async #ensureSession(): Promise<boolean> {
    if (
      !this.getPluginState().authenticated &&
      this.#needsLogin &&
      !(await this.#connect())
    )
      return false
    // Without a grant only a listing tells us which prefix the session is
    // rooted at, so make sure we have had one before judging a key.
    if (this.#grant || this.#session !== undefined) return true
    await this.view.openFolder(this.rootFolderId)
    if (this.#session !== undefined) return true
    // The stored session no longer works: open a new one, once.
    if (this.getPluginState().authenticated !== false) return false
    if (!(await this.#connect())) return false
    await this.view.openFolder(this.rootFolderId)
    return this.#grant !== null || this.#session !== undefined
  }

  /** Logs in (which lists the root); resolves to whether that worked. */
  async #connect(): Promise<boolean> {
    await this.view.handleAuth({})
    return Boolean(this.getPluginState().authenticated)
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
        run: this.#withToast(async ({ item, view }) => {
          const key = S3.keyOf(item.id)
          const { parent, name, isFolder } = splitKey(key)
          const value = typedPath(
            await view.prompt({
              title: this.i18n('renameOrMoveTitle', { name }),
              label: this.i18n('renameOrMovePrompt'),
              defaultValue: name,
              confirmLabel: this.i18n('rename'),
            }),
          )
          if (!value) return undefined
          // A bare name renames in place; a path is relative to the browsing
          // root the session is scoped to.
          const isMove = value.includes('/')
          const path = `${isMove ? this.rootPrefix : parent}${value}`
          const destination = isFolder ? asFolderKey(path) : path
          if (destination === key) return undefined
          await this.#runWithProgress(
            view,
            MOVE_PROGRESS,
            [key],
            (_, options) => this.#move(key, destination, options),
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
        run: this.#withToast(async ({ item, view }) => {
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
          await this.#runWithProgress(
            view,
            DELETE_PROGRESS,
            [key],
            (_, options) => this.#delete(key, options),
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
        run: this.#withToast(async ({ currentFolderId, view }) => {
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

  /** Bulk actions over the multi-selection in manager mode. */
  builtInBulkActions(): ProviderBulkAction<M, B>[] {
    return [
      {
        id: 's3:bulkMove',
        label: this.i18n('moveSelected'),
        run: this.#withToast(async ({ items, view }) => {
          const input = typedPath(
            await view.prompt({
              title: this.i18n('moveSelected'),
              label: this.i18n('moveSelectedPrompt'),
              confirmLabel: this.i18n('move'),
            }),
          )
          if (input === undefined) return undefined
          // Typed destinations are relative to the browsing root.
          const folder = `${this.rootPrefix}${asFolderKey(input)}`
          // ProviderView hands us the top-most selected items only: moving a
          // folder covers everything under it.
          const keys = items.map((item) => S3.keyOf(item.id))
          await this.#runWithProgress(
            view,
            MOVE_PROGRESS,
            keys,
            (key, options) => {
              const { name, isFolder } = splitKey(key)
              return this.#move(
                key,
                `${folder}${name}${isFolder ? '/' : ''}`,
                options,
              )
            },
            { bulk: true },
          )
          return this.i18n('itemsMoved', { smart_count: keys.length })
        }),
      },
      {
        id: 's3:bulkDelete',
        label: this.i18n('deleteItem'),
        danger: true,
        run: this.#withToast(async ({ items, view }) => {
          const confirmed = await view.confirm({
            title: this.i18n('deleteSelectedConfirm', {
              smart_count: items.length,
            }),
            confirmLabel: this.i18n('deleteItem'),
            danger: true,
          })
          if (!confirmed) return undefined
          await this.#runWithProgress(
            view,
            DELETE_PROGRESS,
            items.map((item) => S3.keyOf(item.id)),
            (key, options) => this.#delete(key, options),
            { bulk: true },
          )
          return this.i18n('itemsDeleted', { smart_count: items.length })
        }),
      },
    ]
  }

  /** Both Companion and the grant must allow changes; nothing may before the first listing. */
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

  /**
   * Wraps an action's `run` so it only has to return the success toast; an
   * action that returns nothing did nothing (a cancelled prompt) and says so
   * with `false`, which keeps ProviderView from refreshing the listing. Errors
   * keep going through ProviderView.
   */
  #withToast<Context>(run: (context: Context) => Promise<string | undefined>) {
    return async (context: Context): Promise<false | undefined> => {
      const message = await run(context)
      if (!message) return false
      this.uppy.info(message, 'info', 3000)
      return undefined
    }
  }

  /**
   * Runs `op` on each key, one after the other, behind ProviderView's progress
   * screen. A folder reports its files as it goes; a bulk action also says
   * which of the items it is on.
   */
  #runWithProgress(
    view: ProviderViews<M, B>,
    labels: typeof MOVE_PROGRESS | typeof DELETE_PROGRESS,
    keys: string[],
    op: (key: string, options: OperationOptions) => Promise<void>,
    { bulk = false } = {},
  ): Promise<void> {
    return view.runWithProgress(async ({ signal, setProgress }) => {
      for (const [index, key] of keys.entries()) {
        const item = { item: index + 1, items: keys.length }
        if (bulk) {
          setProgress(
            this.i18n(labels.items, { done: item.item, total: item.items }),
          )
        }
        await op(key, {
          signal,
          onProgress: (done, total) =>
            setProgress(
              bulk
                ? this.i18n(labels.itemFiles, { ...item, done, total })
                : this.i18n(labels.files, { done, total }),
            ),
        })
      }
    })
  }

  /**
   * Moves one item. The generic S3 provider only moves files: a folder is a key
   * prefix, so the client walks it and moves its files one by one (see
   * `moveFolder`), unless the session reports that the backend moves whole
   * folders itself (Transloadit Storage does, preserving asset identity).
   */
  async #move(
    key: string,
    destination: string,
    { signal, onProgress }: OperationOptions,
  ): Promise<void> {
    if (key.endsWith('/')) {
      if (destination === key) return
      if (destination.startsWith(key)) {
        // The same message Companion would answer with.
        throw new UserFacingApiError(this.i18n('s3FolderIntoItself'))
      }
      if (!this.#session?.supportsMoveFolder) {
        await moveFolder({
          provider: this.provider,
          source: key,
          target: destination,
          signal,
          onProgress,
          log: this.#log,
        })
        return
      }
    }
    await this.provider.moveItem(key, destination, { signal })
  }

  /**
   * Deletes one item. Companion only deletes a folder once it is empty, so a
   * folder is walked and emptied first (see `deleteFolder`).
   */
  async #delete(
    key: string,
    { signal, onProgress }: OperationOptions,
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
      log: this.#log,
    })
  }

  /** (Re)compute the actions: the integrator's switch, and what the session may do. */
  #applyActions(): void {
    const enableActions = this.opts.enableActions !== false
    // The per-item actions check `canWrite` themselves: a subclass may add
    // read-only ones (e.g. download).
    const withBuiltIns = enableActions && this.canWrite
    this.view.opts.actions = [
      ...(enableActions ? this.builtInActions() : []),
      ...(this.opts.actions ?? []),
    ]
    this.view.opts.toolbarActions = [
      ...(withBuiltIns ? this.builtInToolbarActions() : []),
      ...(this.opts.toolbarActions ?? []),
    ]
    this.view.opts.bulkActions = [
      ...(withBuiltIns ? this.builtInBulkActions() : []),
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
    this.#maybeAutoConnect()
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
   * Connects on the first render instead of showing the connect screen.
   *
   * Without a stored session, this logs in before ProviderViews renders for
   * the first time: its first render probes for a session with an
   * unauthenticated listing — a 401 by design — which is wasted (and logged
   * by browsers) when we already know there is none and how to open one.
   * With a stored session, it only steps in once that session turned out to
   * be invalid after all.
   */
  #maybeAutoConnect(): void {
    if (this.#autoConnectAttempted || this.opts.autoConnect === false) return
    if (!this.#needsLogin) {
      const { authenticated, didFirstRender } = this.getPluginState()
      if (!didFirstRender || authenticated !== false) return
    }
    this.#autoConnectAttempted = true
    // handleAuth lists the root itself: skip the probing render.
    if (this.#needsLogin) this.setPluginState({ didFirstRender: true })
    this.view
      .handleAuth({})
      .catch((err: unknown) => this.#warn('auto-connect failed', err))
  }

  #log = (message: string): void => this.uppy.log(`[S3] ${message}`)

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
