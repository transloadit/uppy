import classNames from 'classnames'
import debounce from 'lodash/debounce.js'
import type { h } from 'preact'
import packageJson from '../../../package.json' with { type: 'json' }
import { describeCompanionError } from '../../companion-client/errorCodes.js'
import type {
  Body,
  Meta,
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  Uppy,
  ValidateableFile,
} from '../../index.js'
import ErrorWithCause from '../../utils/ErrorWithCause.js'
import type { CompanionFile, I18n } from '../../utils/index.js'
import { remoteFileObjToLocal } from '../../utils/index.js'
import Browser from '../Browser.js'
import BulkActions from '../BulkActions.js'
import FilterInput from '../FilterInput.js'
import FooterActions from '../FooterActions.js'
import ItemDetailDialog from '../ItemDetailDialog.js'
import ProviderDialog from '../ProviderDialog.js'
import ProviderDialogController, {
  type ConfirmOptions,
  type PromptOptions,
} from '../ProviderDialogController.js'
import addFiles from '../utils/addFiles.js'
import getClickedRange from '../utils/getClickedRange.js'
import handleError from '../utils/handleError.js'
import getBreadcrumbs from '../utils/PartialTreeUtils/getBreadcrumbs.js'
import getCheckedFilesWithPaths from '../utils/PartialTreeUtils/getCheckedFilesWithPaths.js'
import getNumberOfSelectedFiles from '../utils/PartialTreeUtils/getNumberOfSelectedFiles.js'
import PartialTreeUtils from '../utils/PartialTreeUtils/index.js'
import shouldHandleScroll from '../utils/shouldHandleScroll.js'
import AuthView from './AuthView.js'
import GlobalSearchView from './GlobalSearchView.js'
import Header from './Header.js'

export function defaultPickerIcon(): h.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="30"
      height="30"
      viewBox="0 0 30 30"
    >
      <path d="M15 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15zm4.258-12.676v6.846h-8.426v-6.846H5.204l9.82-12.364 9.82 12.364H19.26z" />
    </svg>
  )
}

const getDefaultState = (
  rootFolderId: string | null,
): UnknownProviderPluginState => ({
  authenticated: undefined, // we don't know yet
  partialTree: [
    {
      type: 'root',
      id: rootFolderId,
      cached: false,
      nextPagePath: null,
    },
  ],
  currentFolderId: rootFolderId,
  searchString: '',
  didFirstRender: false,
  username: null,
  loading: false,
  selectionActive: false,
  detailItemId: undefined,
})

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

/**
 * Shape of the responses Companion returns from its `list` and `search`
 * endpoints. The `Provider` methods are generic, so we pass this as the
 * expected response type at the call sites.
 */
type ProviderListResponse = {
  username: string
  nextPagePath: string | null
  items: CompanionFile[]
}

/** `node` and its ancestors below the root, nearest first. */
function lineage(
  byId: Map<PartialTreeId, PartialTreeFile | PartialTreeFolder>,
  node: PartialTreeFile | PartialTreeFolderNode,
): (PartialTreeFile | PartialTreeFolderNode)[] {
  const chain = [node]
  let parent = byId.get(node.parentId)
  while (parent && parent.type !== 'root') {
    chain.push(parent)
    parent = byId.get(parent.parentId)
  }
  return chain
}

/**
 * What an action's `run` returns: `false` when it did nothing (a cancelled
 * prompt), which keeps the current listing instead of refreshing it.
 */
// biome-ignore lint/suspicious/noConfusingVoidType: `run` may return nothing.
type ActionResult = Promise<void | false> | void | false

/**
 * Context handed to a per-item action (rename, delete, copy URL, …).
 *
 * @experimental Part of the file-management API added for `@uppy/s3`: it
 * will change incompatibly, also in minor releases.
 */
export interface ProviderActionContext<M extends Meta, B extends Body> {
  item: PartialTreeFile | PartialTreeFolderNode
  view: ProviderView<M, B>
  uppy: Uppy<M, B>
  i18n: I18n
}

/**
 * A per-item action shown in the item's "⋯" menu.
 *
 * @experimental Part of the file-management API added for `@uppy/s3`: it
 * will change incompatibly, also in minor releases.
 */
export interface ProviderAction<M extends Meta, B extends Body> {
  id: string
  label: string
  /** Renders red in the menu / detail dialog (destructive actions). */
  danger?: boolean
  /** Which items get this action; defaults to 'all'. */
  appliesTo?: 'file' | 'folder' | 'all'
  /** Reload the current folder after the action ran (default true). */
  refresh?: boolean
  /** Return false for a cancellation/no-op to retain the current listing. */
  run: (context: ProviderActionContext<M, B>) => ActionResult
}

/**
 * Context handed to a toolbar (current-folder level) action such as "New folder".
 *
 * @experimental Part of the file-management API added for `@uppy/s3`: it
 * will change incompatibly, also in minor releases.
 */
export interface ProviderToolbarActionContext<M extends Meta, B extends Body> {
  currentFolderId: PartialTreeId
  view: ProviderView<M, B>
  uppy: Uppy<M, B>
  i18n: I18n
}

/**
 * @experimental Part of the file-management API added for `@uppy/s3`: it
 * will change incompatibly, also in minor releases.
 */
export interface ProviderToolbarAction<M extends Meta, B extends Body> {
  id: string
  label: string
  refresh?: boolean
  run: (context: ProviderToolbarActionContext<M, B>) => ActionResult
}

/**
 * Context handed to a bulk action over the currently selected items.
 *
 * @experimental Part of the file-management API added for `@uppy/s3`: it
 * will change incompatibly, also in minor releases.
 */
export interface ProviderBulkActionContext<M extends Meta, B extends Body> {
  items: (PartialTreeFile | PartialTreeFolderNode)[]
  view: ProviderView<M, B>
  uppy: Uppy<M, B>
  i18n: I18n
}

/**
 * Manager mode: an action over the multi-selected items (bulk delete, move, …).
 *
 * @experimental Part of the file-management API added for `@uppy/s3`: it
 * will change incompatibly, also in minor releases.
 */
export interface ProviderBulkAction<M extends Meta, B extends Body> {
  id: string
  label: string
  danger?: boolean
  refresh?: boolean
  run: (context: ProviderBulkActionContext<M, B>) => ActionResult
}

export interface Opts<M extends Meta, B extends Body> {
  provider: UnknownProviderPlugin<M, B>['provider']
  /**
   * Per-item actions (rename, delete, …) rendered in an item menu.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  actions?: ProviderAction<M, B>[]
  /**
   * Folder-level actions (new folder, …) rendered in the header.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  toolbarActions?: ProviderToolbarAction<M, B>[]
  /**
   * 'picker' (default): rows are checkboxes and the footer adds the selection
   * to Uppy. 'manager' (file-library UIs): a plain click opens an item's
   * details, multi-select hides behind an explicit toggle, and the selection
   * feeds `bulkActions` instead of picking.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  mode?: 'picker' | 'manager'
  /**
   * Actions over the multi-selected items: in the header while something is
   * checked (picker mode), or in the footer of the manager's selection mode.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  bulkActions?: ProviderBulkAction<M, B>[]
  /**
   * Manager mode: resolves a preview image URL for the detail modal.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  getPreviewUrl?: (
    item: PartialTreeFile | PartialTreeFolderNode,
  ) => Promise<string>
  /**
   * The plugin is the whole page: no user/logout row in the header (the app
   * owns the session).
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  standalone?: boolean
  viewType: 'list' | 'grid'
  showTitles: boolean
  showFilter: boolean
  showBreadcrumbs: boolean
  loadAllFiles: boolean
  renderAuthForm?: (args: {
    pluginName: string
    i18n: I18n
    loading: boolean | string
    onAuth: (authFormData: unknown) => Promise<void>
  }) => h.JSX.Element
  virtualList: boolean
  supportsSearch?: boolean
}
type PassedOpts<M extends Meta, B extends Body> = Optional<
  Opts<M, B>,
  | 'viewType'
  | 'showTitles'
  | 'showFilter'
  | 'showBreadcrumbs'
  | 'loadAllFiles'
  | 'virtualList'
>
type DefaultOpts<M extends Meta, B extends Body> = Omit<Opts<M, B>, 'provider'>
type RenderOpts<M extends Meta, B extends Body> = Omit<
  PassedOpts<M, B>,
  'provider'
>
/**
 * Class to easily generate generic views for Provider plugins
 *
 * We have a *search view* and a *normal view*.
 * Search view is only used when the Provider supports server side search i.e. provider.search method is implemented for the provider.
 * The state is stored in searchResults.
 * Search view is implemented in components GlobalSearchView and SearchResultItem.
 * We conditionally switch between search view and normal in the render method when a server side search is initiated.
 * When users type their search query in search input box (SearchInput component), we debounce the input and call provider.search method to fetch results from the server.
 * when the user enters a folder in search results or clears the search input query we switch back to Normal View.
 */
export default class ProviderView<M extends Meta, B extends Body> {
  static VERSION = packageJson.version

  // Test hook (mirrors GoldenRetriever pattern): allow tests to override debounce time
  // @ts-expect-error test-only hook key
  static [Symbol.for('uppy test: searchDebounceMs')]: number | undefined

  plugin: UnknownProviderPlugin<M, B>

  provider: UnknownProviderPlugin<M, B>['provider']

  opts: Opts<M, B>

  isHandlingScroll: boolean = false

  previousCheckbox: string | null = null
  #searchDebounced: () => void

  constructor(plugin: UnknownProviderPlugin<M, B>, opts: PassedOpts<M, B>) {
    this.plugin = plugin
    this.provider = opts.provider
    this.#dialogs = new ProviderDialogController(plugin)

    const defaultOptions: DefaultOpts<M, B> = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      loadAllFiles: false,
      virtualList: false,
    }
    this.opts = { ...defaultOptions, ...opts }

    this.openFolder = this.openFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.resetPluginState = this.resetPluginState.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.render = this.render.bind(this)
    this.cancelSelection = this.cancelSelection.bind(this)
    this.toggleCheckbox = this.toggleCheckbox.bind(this)
    this.openSearchResultFolder = this.openSearchResultFolder.bind(this)
    this.clearSearchState = this.clearSearchState.bind(this)

    // Set default state for the plugin
    this.resetPluginState()

    // todo
    // @ts-expect-error this should be typed in @uppy/dashboard.
    this.plugin.uppy.on('dashboard:close-panel', this.resetPluginState)

    this.plugin.uppy.registerRequestClient(
      this.provider.provider,
      this.provider,
    )

    // Configure debounced search with test override
    const testHookSymbol = Symbol.for('uppy test: searchDebounceMs')
    const testWait = (
      ProviderView as unknown as Record<symbol, number | undefined>
    )[testHookSymbol]
    const wait = testWait ?? 500
    const debounceOpts =
      testWait === 0 ? { leading: true, trailing: true } : undefined
    this.#searchDebounced = debounce(this.#search, wait, debounceOpts)
  }

  resetPluginState(): void {
    this.#selectionRoots.clear()
    this.#dialogs.cancel()
    this.plugin.setPluginState(getDefaultState(this.plugin.rootFolderId))
  }

  /**
   * Forget everything we know about the current folder and fetch it again.
   * Used after mutations (rename, delete, new folder, upload into folder).
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  refreshCurrentFolder = async (invalidateAll = false): Promise<void> => {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    // A refresh scheduled after an action can land once the plugin is gone.
    if (partialTree == null) return
    // Remember what was selected so a refresh does not silently drop it.
    const checkedIds = partialTree.flatMap((node) =>
      node.type !== 'root' &&
      node.parentId === currentFolderId &&
      node.status === 'checked'
        ? [node.id]
        : [],
    )
    const byId = new Map(partialTree.map((node) => [node.id, node]))
    const isInsideCurrent = (node: PartialTreeFile | PartialTreeFolderNode) =>
      lineage(byId, node).some(({ parentId }) => parentId === currentFolderId)
    // A move can affect a previously visited destination, and a failed batch can have partial
    // writes. Retain navigation ancestors, but no sibling/descendant listings after a mutation.
    const navigationIds = new Set(
      getBreadcrumbs(partialTree, currentFolderId).map((node) => node.id),
    )
    const nextTree = partialTree
      .filter((node) => node.type === 'root' || !isInsideCurrent(node))
      .filter((node) => !invalidateAll || navigationIds.has(node.id))
      .map((node) =>
        (invalidateAll || node.id === currentFolderId) && node.type !== 'file'
          ? // Checked ancestors may only reflect previously selected children. Never let a new
            // listing inherit that aggregate selection; restore surviving children explicitly below.
            {
              ...node,
              status: 'unchecked' as const,
              cached: false,
              nextPagePath: null,
            }
          : node,
      )
    this.plugin.setPluginState({ partialTree: nextTree })
    await this.openFolder(currentFolderId)

    const { partialTree: refreshedTree, detailItemId } =
      this.plugin.getPluginState()
    // The item of an open detail modal did not survive the refresh.
    if (detailItemId && !refreshedTree.some(({ id }) => id === detailItemId)) {
      this.closeItemDetail()
    }
    // Re-apply the selection to the items that survived the refresh.
    const survivors = checkedIds.filter((id) =>
      refreshedTree.some(
        (node) =>
          node.type !== 'root' && node.id === id && node.status !== 'checked',
      ),
    )
    if (survivors.length > 0) {
      this.plugin.setPluginState({
        partialTree: PartialTreeUtils.afterToggleCheckbox(
          refreshedTree,
          survivors,
        ),
      })
    }
  }

  /**
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  runAction = (
    action: ProviderAction<M, B>,
    item: PartialTreeFile | PartialTreeFolderNode,
  ): Promise<void> =>
    this.#run(action, () => action.run({ item, ...this.#actionContext() }))

  /**
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  runToolbarAction = (action: ProviderToolbarAction<M, B>): Promise<void> =>
    this.#run(action, () =>
      action.run({
        currentFolderId: this.plugin.getPluginState().currentFolderId,
        ...this.#actionContext(),
      }),
    )

  #actionContext = () => {
    const { uppy } = this.plugin
    return { view: this, uppy, i18n: uppy.i18n }
  }

  /**
   * Runs an action and reports errors as toasts. An action that returns
   * `false` did nothing (a cancelled prompt) and keeps the current listing;
   * anything else, including a failure or a cancelled long operation, refreshes
   * the folder so a partially applied change shows.
   */
  async #run(
    { refresh }: { refresh?: boolean | undefined },
    run: () => ActionResult,
  ): Promise<void> {
    try {
      if ((await run()) === false) return
    } catch (err) {
      this.#reportActionError(err)
    }
    if (refresh !== false) await this.refreshCurrentFolder(true)
  }

  #reportActionError(err: unknown): void {
    const { uppy } = this.plugin
    if ((err as { name?: unknown } | null | undefined)?.name === 'AbortError') {
      uppy.log('[ProviderView] action cancelled', 'warning')
      return
    }
    const raw = err instanceof Error ? err.message : String(err)
    uppy.log(`[ProviderView] action failed: ${raw}`, 'error')
    // A `UserFacingApiError` is for the user: a locale key from Companion, or a
    // translated message a plugin threw. Any other text is not: a failed
    // Companion request (the request client wraps those, auth errors aside)
    // says so, anything else (a bug, a browser API refusing) only that the
    // action failed.
    const message =
      err instanceof Error && err.name === 'UserFacingApiError'
        ? describeCompanionError(uppy.i18n, err)
        : err instanceof ErrorWithCause ||
            (err as { isAuthError?: unknown } | null)?.isAuthError === true
          ? uppy.i18n('companionError')
          : uppy.i18n('actionFailed')
    uppy.info(message, 'error', 5000)
  }

  #cancelLongOperation: (() => void) | undefined

  /**
   * Runs a long write operation (a folder move, a bulk delete) behind the
   * loading screen, with a Cancel button and progress text. `signal` aborts
   * when the user cancels, the panel closes or uploads are cancelled; pass it
   * to every request. The operation should throw an `AbortError` when it
   * stops early, which `#run` treats as a cancel rather than a failure.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  async runWithProgress(
    op: (context: {
      signal: AbortSignal
      setProgress: (label: string) => void
    }) => Promise<void>,
  ): Promise<void> {
    try {
      await this.#withAbort(async (signal) => {
        // This operation's controller: a later request replaces the field.
        const controller = this.#abortController
        this.#cancelLongOperation = () => controller?.abort()
        this.setLoading(true)
        await op({ signal, setProgress: (label) => this.setLoading(label) })
      })
    } finally {
      this.#cancelLongOperation = undefined
      this.setLoading(false)
    }
  }

  /**
   * Manager mode: switch the multi-select checkboxes on or off.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  toggleSelectionMode = (): void => {
    const { selectionActive } = this.plugin.getPluginState()
    if (selectionActive) this.cancelSelection()
    this.plugin.setPluginState({ selectionActive: !selectionActive })
  }

  /**
   * The item of the open detail modal as last seen in the tree. A refresh
   * drops the folder's items until it is listed again; the modal keeps
   * showing this one meanwhile instead of closing and reopening.
   */
  #detailItem: PartialTreeFile | PartialTreeFolderNode | undefined

  /**
   * Manager mode: open the detail modal for one item.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  openItemDetail = (item: PartialTreeFile | PartialTreeFolderNode): void => {
    this.#detailItem = item
    this.plugin.setPluginState({ detailItemId: item.id })
  }

  /**
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  closeItemDetail = (): void => {
    this.plugin.setPluginState({ detailItemId: undefined })
  }

  // Checkbox aggregation also checks parents of selected children. Only user-selected folders
  // (and their selected descendants) may become folder mutation targets.
  #selectionRoots = new Set<string>()

  /**
   * Run a bulk action over the checked items, then clear the selection.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  runBulkAction = (action: ProviderBulkAction<M, B>): Promise<void> =>
    this.#run(action, async () => {
      const { partialTree } = this.plugin.getPluginState()
      const byId = new Map(partialTree.map((node) => [node.id, node]))
      const checked = partialTree.filter(
        (node): node is PartialTreeFile | PartialTreeFolderNode =>
          node.type !== 'root' &&
          node.status === 'checked' &&
          (node.type === 'file' ||
            lineage(byId, node).some(({ id }) => this.#selectionRoots.has(id))),
      )
      const checkedIds = new Set(checked.map((node) => node.id))
      // Only the top-most: an action on a folder covers what is inside it.
      const items = checked.filter(
        (node) =>
          !lineage(byId, node)
            .slice(1)
            .some(({ id }) => checkedIds.has(id)),
      )
      if (items.length === 0) return false
      if ((await action.run({ items, ...this.#actionContext() })) === false)
        return false
      this.cancelSelection()
    })

  #dialogs: ProviderDialogController

  /**
   * Ask the user for a string with an inline dialog (instead of `window.prompt`).
   * Resolves with `null` when the user cancels.
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  prompt(options: PromptOptions): Promise<string | null> {
    return this.#dialogs.prompt(options)
  }

  /**
   * Ask the user to confirm something with an inline dialog (instead of `window.confirm`).
   *
   * @experimental Part of the file-management API added for `@uppy/s3`: it
   * will change incompatibly, also in minor releases.
   */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return this.#dialogs.confirm(options)
  }

  tearDown(): void {
    // Nothing.
  }

  setLoading(loading: boolean | string): void {
    this.plugin.setPluginState({ loading })
  }

  get isLoading() {
    return this.plugin.getPluginState().loading
  }

  cancelSelection(): void {
    this.#selectionRoots.clear()
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree: PartialTree = partialTree.map((item) =>
      item.type === 'root' ? item : { ...item, status: 'unchecked' },
    )
    this.plugin.setPluginState({ partialTree: newPartialTree })
  }

  clearSearchState(): void {
    this.plugin.setPluginState({
      searchResults: undefined,
    })
  }

  #abortController: AbortController | undefined

  async #withAbort(op: (signal: AbortSignal) => Promise<void>) {
    // prevent multiple requests in parallel from causing race conditions
    this.#abortController?.abort()
    const abortController = new AbortController()
    this.#abortController = abortController
    const cancelRequest = () => {
      abortController.abort()
    }
    try {
      // @ts-expect-error this should be typed in @uppy/dashboard.
      // Even then I don't think we can make this work without adding dashboard
      // as a dependency to provider-views.
      this.plugin.uppy.on('dashboard:close-panel', cancelRequest)
      this.plugin.uppy.on('cancel-all', cancelRequest)

      await op(abortController.signal)
    } finally {
      // Only this operation's controller: a newer operation may have replaced
      // it (and aborted this one) meanwhile.
      if (this.#abortController === abortController) {
        this.#abortController = undefined
      }
      // @ts-expect-error this should be typed in @uppy/dashboard.
      // Even then I don't think we can make this work without adding dashboard
      // as a dependency to provider-views.
      this.plugin.uppy.off('dashboard:close-panel', cancelRequest)
      this.plugin.uppy.off('cancel-all', cancelRequest)
    }
  }

  /**
   * Ends a listing's loading state, unless a long operation (`runWithProgress`)
   * has taken the screen over meanwhile: the listing it aborted must not wipe
   * the progress screen on its way out.
   */
  #doneLoading(): void {
    if (this.#cancelLongOperation === undefined) this.setLoading(false)
  }

  async #search(): Promise<void> {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()

    const currentFolder = partialTree.find((i) => i.id === currentFolderId)!

    if (searchString.trim() === '') {
      this.#abortController?.abort()
      this.clearSearchState()
      return
    }

    this.setLoading(true)
    await this.#withAbort(async (signal) => {
      const scopePath =
        currentFolder.type === 'root' ? undefined : currentFolderId
      const { items } = await this.provider.search<ProviderListResponse>(
        searchString,
        {
          signal,
          path: scopePath,
        },
      )

      // For each searched file, build the entire path (from the root all the way to the leaf node)
      // This is because we need to make sure all ancestor folders are present in the partialTree before we open the folder or check the file.
      // This is needed because when the user opens a folder we need to have all its parent folders in the partialTree to be able to render the breadcrumbs correctly.
      // Similarly when the user checks a file, we need to have all it's ancestor folders in the partialTree to be able to percolateUp the checked state correctly to its ancestors.

      const { partialTree } = this.plugin.getPluginState()
      const newPartialTree: PartialTree = [...partialTree]

      for (const file of items) {
        // Decode URI and split into path segments
        const decodedPath = decodeURIComponent(file.requestPath)
        const segments = decodedPath.split('/').filter((s) => s.length > 0)

        // Start from root
        let parentId: PartialTreeId = this.plugin.rootFolderId
        let isParentFolderChecked: boolean

        // Walk through each segment starting from the root and build child nodes if they don't exist
        segments.forEach((segment, index, arr) => {
          const pathSegments = segments.slice(0, index + 1)
          const encodedPath = encodeURIComponent(`/${pathSegments.join('/')}`)

          // Skip if node already exists
          const existingNode = newPartialTree.find(
            (n) => n.id === encodedPath && n.type !== 'root',
          ) as PartialTreeFolderNode | PartialTreeFile | undefined
          if (existingNode) {
            parentId = encodedPath
            isParentFolderChecked = existingNode.status === 'checked'
            return
          }

          const isLeafNode = index === arr.length - 1
          let node: PartialTreeFolderNode | PartialTreeFile

          // propagate checked state from parent to children, if the user has checked the parent folder before searching
          // and the parent folder is an ancestor of the searched file
          // see also afterOpenFolder which contains similar logic, we should probably refactor and reuse some
          const status = isParentFolderChecked ? 'checked' : 'unchecked'

          // Build the Leaf Node, it can be a file (`PartialTreeFile`) or a folder (`PartialTreeFolderNode`).
          // Since we Already have the leaf node's data (`file`, `CompanionFile`) from the searchResults: CompanionFile[], we just use that.
          if (isLeafNode) {
            if (file.isFolder) {
              node = {
                type: 'folder',
                id: encodedPath,
                cached: false,
                nextPagePath: null,
                status,
                parentId,
                data: file,
              }
            } else {
              const restrictionError = this.validateSingleFile(file)
              node = {
                type: 'file',
                id: encodedPath,
                restrictionError,
                status: !restrictionError ? status : 'unchecked',
                parentId,
                data: file,
              }
            }
          } else {
            // not leaf node, so by definition it is a folder leading up to the leaf node
            node = {
              type: 'folder',
              id: encodedPath,
              cached: false,
              nextPagePath: null,
              status,
              parentId,
              data: {
                // we don't have any data, so fill only the necessary fields
                name: decodeURIComponent(segment),
                icon: 'folder',
                isFolder: true,
              },
            }
          }
          newPartialTree.push(node)
          parentId = encodedPath // This node becomes parent for the next iteration
          isParentFolderChecked = status === 'checked'
        })
      }

      this.plugin.setPluginState({
        partialTree: newPartialTree,
        searchResults: items.map((item) => item.requestPath),
      })
    }).catch(handleError(this.plugin.uppy))
    this.#doneLoading()
  }

  // debounced search function is initialized in the constructor

  onSearchInput = (s: string): void => {
    this.plugin.setPluginState({ searchString: s })
    if (this.opts.supportsSearch) {
      this.#searchDebounced()
    }
  }

  async openSearchResultFolder(folderId: PartialTreeId): Promise<void> {
    // stop searching
    this.plugin.setPluginState({ searchString: '' })

    // now open folder using the normal view
    await this.openFolder(folderId)
  }

  async openFolder(folderId: PartialTreeId): Promise<void> {
    // always switch away from the search view when opening a folder, whether it happens from the search view or by clicking breadcrumbs
    this.clearSearchState()

    this.previousCheckbox = null
    // Returning cached folder
    const { partialTree } = this.plugin.getPluginState()
    const clickedFolder = partialTree.find(
      (folder) => folder.id === folderId,
    )! as PartialTreeFolder

    if (clickedFolder.cached) {
      this.plugin.setPluginState({
        currentFolderId: folderId,
        searchString: '',
      })
      return
    }

    this.setLoading(true)
    await this.#withAbort(async (signal) => {
      let currentPagePath = folderId
      let currentItems: CompanionFile[] = []
      do {
        const { username, nextPagePath, items } =
          await this.provider.list<ProviderListResponse>(currentPagePath, {
            signal,
          })
        // It's important to set the username during one of our first fetches
        this.plugin.setPluginState({ username })

        currentPagePath = nextPagePath
        currentItems = currentItems.concat(items)
        this.setLoading(
          this.plugin.uppy.i18n('loadedXFiles', {
            numFiles: currentItems.length,
          }),
        )
      } while (this.opts.loadAllFiles && currentPagePath)

      const newPartialTree = PartialTreeUtils.afterOpenFolder(
        partialTree,
        currentItems,
        clickedFolder,
        currentPagePath,
        this.validateSingleFile,
      )

      this.plugin.setPluginState({
        partialTree: newPartialTree,
        currentFolderId: folderId,
        searchString: '',
      })
    }).catch(handleError(this.plugin.uppy))

    this.#doneLoading()
  }

  /**
   * Removes session token on client side.
   */
  async logout(): Promise<void> {
    this.#selectionRoots.clear()
    await this.#withAbort(async (signal) => {
      const res = await this.provider.logout<{
        ok: boolean
        revoked: boolean
        manual_revoke_url: string
      }>({
        signal,
      })
      // res.ok is from the JSON body, not to be confused with Response.ok
      if (res.ok) {
        if (!res.revoked) {
          const message = this.plugin.uppy.i18n('companionUnauthorizeHint', {
            provider: this.plugin.title,
            url: res.manual_revoke_url,
          })
          this.plugin.uppy.info(message, 'info', 7000)
        }

        this.plugin.setPluginState({
          ...getDefaultState(this.plugin.rootFolderId),
          authenticated: false,
        })
      }
    }).catch(handleError(this.plugin.uppy))
  }

  async handleAuth(authFormData?: unknown): Promise<void> {
    await this.#withAbort(async (signal) => {
      this.setLoading(true)
      await this.provider.login({ authFormData, signal })
      this.plugin.setPluginState({ authenticated: true })
      await Promise.all([
        this.provider.fetchPreAuthToken(),
        this.openFolder(this.plugin.rootFolderId),
      ])
    }).catch(handleError(this.plugin.uppy))
    this.#doneLoading()
  }

  async handleScroll(event: Event): Promise<void> {
    if (shouldHandleScroll(event)) await this.loadNextPage()
  }

  #nextPageRequest: Promise<boolean> | undefined

  /** Load the current folder's next page, shared by scrolling and programmatic navigation. */
  loadNextPage(): Promise<boolean> {
    if (!this.#nextPageRequest) {
      this.#nextPageRequest = this.#loadNextPage().finally(() => {
        this.#nextPageRequest = undefined
      })
    }
    return this.#nextPageRequest
  }

  async #loadNextPage(): Promise<boolean> {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    const currentFolder = partialTree.find((i) => i.id === currentFolderId)
    if (
      currentFolder &&
      currentFolder.type !== 'file' &&
      currentFolder.nextPagePath
    ) {
      const pagePath = currentFolder.nextPagePath
      let loaded = false
      this.isHandlingScroll = true
      await this.#withAbort(async (signal) => {
        const { nextPagePath, items } =
          await this.provider.list<ProviderListResponse>(pagePath, { signal })
        const current = this.plugin.getPluginState()
        if (signal.aborted || current.currentFolderId !== currentFolderId)
          return
        const newPartialTree = PartialTreeUtils.afterScrollFolder(
          current.partialTree,
          currentFolderId,
          items,
          nextPagePath,
          this.validateSingleFile,
        )

        this.plugin.setPluginState({ partialTree: newPartialTree })
        loaded = true
      }).catch(handleError(this.plugin.uppy))
      this.isHandlingScroll = false
      return loaded
    }
    return false
  }

  validateSingleFile = (file: CompanionFile): string | null => {
    const companionFile: ValidateableFile<M, B> = remoteFileObjToLocal(file)
    const result = this.plugin.uppy.validateSingleFile(companionFile)
    return result
  }

  async donePicking(): Promise<void> {
    const { partialTree } = this.plugin.getPluginState()

    if (this.isLoading) return
    this.setLoading(true)
    await this.#withAbort(async (signal) => {
      // 1. Enrich our partialTree by fetching all 'checked' but not-yet-fetched folders
      const enrichedTree: PartialTree = await PartialTreeUtils.afterFill(
        partialTree,
        (path: PartialTreeId) => this.provider.list(path, { signal }),
        this.validateSingleFile,
        (n) => {
          this.setLoading(
            this.plugin.uppy.i18n('addedNumFiles', { numFiles: n }),
          )
        },
      )

      // 2. Now that we know how many files there are - recheck aggregateRestrictions!
      const aggregateRestrictionError =
        this.validateAggregateRestrictions(enrichedTree)
      if (aggregateRestrictionError) {
        this.plugin.setPluginState({ partialTree: enrichedTree })
        return
      }

      // 3. Add files
      const companionFiles = getCheckedFilesWithPaths(enrichedTree)
      addFiles(companionFiles, this.plugin, this.provider)

      // 4. Reset state
      this.resetPluginState()
    }).catch(handleError(this.plugin.uppy))
    this.#doneLoading()
  }

  toggleCheckbox(
    ourItem: PartialTreeFolderNode | PartialTreeFile,
    isShiftKeyPressed: boolean,
  ) {
    const { partialTree } = this.plugin.getPluginState()

    const clickedRange = getClickedRange(
      ourItem.id,
      this.getDisplayedPartialTree(),
      isShiftKeyPressed,
      this.previousCheckbox,
    )

    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(
      partialTree,
      clickedRange,
    )

    const statusById = new Map(
      newPartialTree.map((node) => [
        node.id,
        node.type === 'root' ? undefined : node.status,
      ]),
    )
    for (const id of clickedRange) {
      if (statusById.get(id) === 'checked') this.#selectionRoots.add(id)
    }
    for (const id of this.#selectionRoots) {
      const status = statusById.get(id)
      if (status === undefined || status === 'unchecked')
        this.#selectionRoots.delete(id)
    }

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.previousCheckbox = ourItem.id
  }

  getDisplayedPartialTree = (): (PartialTreeFile | PartialTreeFolderNode)[] => {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()
    const inThisFolder = partialTree.filter(
      (item) => item.type !== 'root' && item.parentId === currentFolderId,
    ) as (PartialTreeFile | PartialTreeFolderNode)[]

    // If provider supports server side search, we don't filter the items client side
    const filtered =
      this.opts.supportsSearch || searchString.trim() === ''
        ? inThisFolder
        : inThisFolder.filter(
            (item) =>
              (item.data.name ?? this.plugin.uppy.i18n('unnamed'))
                .toLowerCase()
                .indexOf(searchString.trim().toLowerCase()) !== -1,
          )

    return filtered
  }

  getBreadcrumbs = (): PartialTreeFolder[] => {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    return getBreadcrumbs(partialTree, currentFolderId)
  }

  getSelectedAmount = (): number => {
    const { partialTree } = this.plugin.getPluginState()
    return getNumberOfSelectedFiles(partialTree)
  }

  validateAggregateRestrictions = (partialTree: PartialTree) => {
    const checkedFiles = partialTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    ) as PartialTreeFile[]
    const uppyFiles = checkedFiles.map((file) => file.data)
    return this.plugin.uppy.validateAggregateRestrictions(uppyFiles)
  }

  #renderSearchResults() {
    const { i18n } = this.plugin.uppy

    const { searchResults: ids, partialTree } = this.plugin.getPluginState()

    // todo memoize this so we don't have to do it on every render
    const itemsById = new Map<string, PartialTreeFile | PartialTreeFolderNode>()
    partialTree.forEach((item) => {
      if (item.type !== 'root') {
        itemsById.set(item.id, item)
      }
    })

    // the search results view needs data from the partial tree,
    const searchResults = ids!.map((id) => {
      const partialTreeItem = itemsById.get(id)
      if (partialTreeItem == null) throw new Error('Partial tree not complete')
      return partialTreeItem
    })

    return (
      <GlobalSearchView
        searchResults={searchResults}
        openFolder={this.openSearchResultFolder}
        toggleCheckbox={this.toggleCheckbox}
        i18n={i18n}
      />
    )
  }

  render(state: unknown, viewOptions: RenderOpts<M, B> = {}): h.JSX.Element {
    const { didFirstRender } = this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy

    if (!didFirstRender) {
      this.plugin.setPluginState({ didFirstRender: true })
      this.provider.fetchPreAuthToken()
      this.openFolder(this.plugin.rootFolderId)
    }

    const opts: Opts<M, B> = { ...this.opts, ...viewOptions }
    const { authenticated, loading } = this.plugin.getPluginState()
    const pluginIcon = this.plugin.icon || defaultPickerIcon

    if (authenticated === false) {
      return (
        <AuthView
          pluginName={this.plugin.title}
          pluginIcon={pluginIcon}
          handleAuth={this.handleAuth}
          i18n={this.plugin.uppy.i18n}
          renderForm={opts.renderAuthForm}
          loading={loading}
        />
      )
    }

    const {
      partialTree,
      username,
      searchString,
      searchResults,
      dialog,
      selectionActive = false,
      detailItemId,
    } = this.plugin.getPluginState()
    const breadcrumbs = this.getBreadcrumbs()
    const isManager = opts.mode === 'manager'
    const selectable = !isManager || selectionActive
    if (detailItemId) {
      this.#detailItem =
        partialTree.find(
          (node): node is PartialTreeFile | PartialTreeFolderNode =>
            node.type !== 'root' && node.id === detailItemId,
        ) ?? this.#detailItem
    }
    const detailItem =
      this.#detailItem?.id === detailItemId ? this.#detailItem : undefined

    return (
      <div
        className={classNames(
          'uppy-ProviderBrowser',
          `uppy-ProviderBrowser-viewType--${opts.viewType}`,
        )}
      >
        <Header<M, B>
          showBreadcrumbs={opts.showBreadcrumbs}
          openFolder={this.openFolder}
          breadcrumbs={breadcrumbs}
          pluginIcon={pluginIcon}
          title={this.plugin.title}
          logout={this.logout}
          username={username}
          i18n={i18n}
          toolbarActions={opts.toolbarActions ?? []}
          runToolbarAction={this.runToolbarAction}
          standalone={opts.standalone ?? false}
          selectionToggle={
            isManager
              ? {
                  active: selectionActive,
                  onToggle: this.toggleSelectionMode,
                }
              : undefined
          }
          bulkActions={isManager ? undefined : opts.bulkActions}
          runBulkAction={this.runBulkAction}
          selectedCount={
            isManager ? undefined : getNumberOfSelectedFiles(partialTree)
          }
        />
        {opts.showFilter && (
          <FilterInput
            value={searchString}
            onChange={(s: string) => this.onSearchInput(s)}
            onSubmit={() => {}}
            inputLabel={i18n('filter')}
            i18n={i18n}
          />
        )}

        {searchResults ? (
          this.#renderSearchResults()
        ) : (
          <Browser<M, B>
            toggleCheckbox={this.toggleCheckbox}
            displayedPartialTree={this.getDisplayedPartialTree()}
            openFolder={this.openFolder}
            virtualList={opts.virtualList}
            noResultsLabel={i18n('noFilesFound')}
            handleScroll={this.handleScroll}
            viewType={opts.viewType}
            showTitles={opts.showTitles}
            i18n={this.plugin.uppy.i18n}
            isLoading={loading}
            onCancelLoading={this.#cancelLongOperation}
            utmSource="Companion"
            actions={opts.actions ?? []}
            runAction={this.runAction}
            selectable={selectable}
            onFileClick={
              isManager && !selectionActive ? this.openItemDetail : undefined
            }
          />
        )}

        {isManager ? (
          selectionActive && (
            <BulkActions
              partialTree={partialTree}
              bulkActions={opts.bulkActions ?? []}
              runBulkAction={this.runBulkAction}
              i18n={i18n}
            />
          )
        ) : (
          <FooterActions
            partialTree={partialTree}
            donePicking={this.donePicking}
            cancelSelection={this.cancelSelection}
            i18n={i18n}
            validateAggregateRestrictions={this.validateAggregateRestrictions}
          />
        )}
        {detailItem && (
          <ItemDetailDialog
            // A different item gets a fresh dialog (no stale preview).
            key={detailItem.id}
            item={detailItem}
            actions={opts.actions ?? []}
            runAction={this.runAction}
            getPreviewUrl={opts.getPreviewUrl}
            onClose={this.closeItemDetail}
            i18n={i18n}
          />
        )}
        {dialog && (
          <ProviderDialog
            key={this.#dialogs.revision}
            dialog={dialog}
            i18n={i18n}
            onConfirm={this.#dialogs.submit}
            onCancel={this.#dialogs.cancel}
          />
        )}
      </div>
    )
  }
}
