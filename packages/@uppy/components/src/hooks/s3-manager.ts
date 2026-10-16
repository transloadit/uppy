import type Uppy from '@uppy/core'
import type {
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
  ProviderDialogState,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  UppyEventMap,
} from '@uppy/core'
import type {
  ProviderAction,
  ProviderBulkAction,
  ProviderToolbarAction,
  ProviderViews,
} from '@uppy/core/provider-views'
import { dequal } from 'dequal/lite'
import { Subscribers } from './utils.js'

/** @experimental A file or folder row of the manager. */
export type S3ManagerItem = PartialTreeFile | PartialTreeFolderNode

/**
 * @experimental The state of a headless manager-mode storage browser
 * (`@uppy/s3`, `@uppy/transloadit-storage`). It will change incompatibly,
 * also in minor releases. The state and the commands are the hook's own
 * types, not ProviderView's method signatures or plugin state, so what
 * computes them (ProviderView today) can be replaced behind them. The action
 * descriptors are still core's `ProviderAction` types.
 */
export type S3ManagerState = {
  authenticated: boolean | undefined
  /** A string is the progress text of a listing or a long operation. */
  loading: boolean | string
  currentFolderId: PartialTreeId
  /** The open folder's items, not the whole tree. */
  partialTree: S3ManagerItem[]
  breadcrumbs: PartialTreeFolder[]
  /** What a bulk action runs on: the checked items, top-most only. */
  selected: S3ManagerItem[]
  /** Kept while a refresh relists its folder; cleared when it is gone. */
  detailItem: S3ManagerItem | undefined
  /** The prompt or confirm an action is waiting on, if any. */
  dialog: ProviderDialogState | undefined
  /** Whether `cancelOperation` has a running move or bulk change to stop. */
  cancellable: boolean
  actions: ProviderAction<any, any>[]
  toolbarActions: ProviderToolbarAction<any, any>[]
  bulkActions: ProviderBulkAction<any, any>[]
}

/**
 * @experimental See `S3ManagerState`. The commands that start a request
 * (`open`, `openPath`, `loadMore`, `login`, `logout` and the three `run…`)
 * do nothing while `state.cancellable` is set: a request then would abort
 * the running operation part-way.
 */
export type S3ManagerSnapshot = {
  state: S3ManagerState
  /** Open a folder by item id. */
  open: (folderId: PartialTreeId) => Promise<void>
  /** Open a folder by key (e.g. `docs/photos/`); false when it doesn't exist or while busy. */
  openPath: (key: string | null) => Promise<boolean>
  /** Load the open folder's next page; false when there is none or while busy. */
  loadMore: () => Promise<boolean>
  /** Relist the open folder. Selections in other folders are kept. */
  refresh: () => Promise<void>
  /** `visibleOrder` is the rows as shown (sorted, filtered), for shift-click ranges. */
  checkbox: (
    item: S3ManagerItem,
    isShiftKeyPressed: boolean,
    visibleOrder?: S3ManagerItem[],
  ) => void
  cancelSelection: () => void
  openDetail: (item: S3ManagerItem) => void
  closeDetail: () => void
  runAction: (
    action: ProviderAction<any, any>,
    item: S3ManagerItem,
  ) => Promise<void>
  runToolbarAction: (action: ProviderToolbarAction<any, any>) => Promise<void>
  runBulkAction: (action: ProviderBulkAction<any, any>) => Promise<void>
  /** Answer the open dialog (`value` is the prompt's input). */
  submitDialog: (value?: string) => void
  cancelDialog: () => void
  /** Stop a running move or bulk change (`state.loading` is set meanwhile). */
  cancelOperation: () => void
  /** `authFormData` is passed to the provider, e.g. `{ grant }` for `@uppy/s3`. */
  login: (authFormData?: unknown) => Promise<void>
  logout: () => Promise<void>
}

/** @experimental See `S3ManagerSnapshot`. */
export type S3ManagerStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => S3ManagerSnapshot
  mount: () => void
  unmount: () => void
}

type StoragePlugin = UnknownProviderPlugin<any, any> & {
  openFolderPath(key: string | null): Promise<boolean>
}

/**
 * @experimental See `S3ManagerSnapshot`. Controllers of the same plugin share
 * its state (open folder, selection): each one's mount opens its own
 * `initialFolderKey`, after a move or bulk change that is running ends.
 */
export function createS3ManagerController(
  uppy: Uppy<any, any>,
  pluginId: string,
  { initialFolderKey = null }: { initialFolderKey?: string | null } = {},
): S3ManagerStore {
  const plugin = uppy.getPlugin<StoragePlugin>(pluginId)
  if (!plugin) throw new Error(`(${pluginId}) is not installed`)
  if (!plugin.view || typeof plugin.openFolderPath !== 'function') {
    throw new Error(
      `(${pluginId}) is not a manager-mode storage plugin (@uppy/s3, @uppy/transloadit-storage)`,
    )
  }
  const view = plugin.view as ProviderViews<any, any>
  if (view.opts.mode !== 'manager') {
    // Picker mode offers no file changes and picks rather than selects.
    uppy.log(
      `[${pluginId}] is in picker mode: pass \`mode: 'manager'\` for a file manager`,
      'warning',
    )
  }
  const subscribers = new Subscribers()
  let didFirstRender = false
  // The walk to `initialFolderKey`, put off while an operation runs.
  let walkPending = false
  let walkTimer: ReturnType<typeof setTimeout> | undefined

  // Logs in when needed and lists the folder without a rendered panel.
  const walk = () => {
    plugin.openFolderPath(initialFolderKey).catch((err: unknown) => {
      uppy.log(`[${pluginId}] could not open the folder: ${err}`, 'warning')
    })
  }

  // A put-off walk waits until nothing runs, checked a macrotask later: an
  // action relists its folder a few promise ticks after its operation ends,
  // and that listing would abort the walk's. (An action that sends more
  // requests before relisting still can; serialising listings in
  // ProviderView would close that.)
  const walkWhenIdle = () => {
    clearTimeout(walkTimer)
    walkTimer = setTimeout(() => {
      if (view.canCancelOperation || plugin.getPluginState().loading) return
      walkPending = false
      walk()
    })
  }

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
  ) => {
    // `setPluginState` puts every plugin in the patch: compare ours instead.
    if (prev.plugins[pluginId] === next.plugins[pluginId]) return
    if (walkPending) walkWhenIdle()
    subscribers.emit()
  }

  /** `command`, unless a cancellable operation runs: a request now would abort it. */
  const unlessBusy =
    <A extends unknown[], R>(command: (...args: A) => Promise<R>, busy: R) =>
    (...args: A): Promise<R> =>
      view.canCancelOperation ? Promise.resolve(busy) : command(...args)

  const readState = (state: UnknownProviderPluginState): S3ManagerState => ({
    authenticated: state.authenticated,
    loading: state.loading,
    currentFolderId: state.currentFolderId,
    partialTree: view.getDisplayedPartialTree(),
    breadcrumbs: view.getBreadcrumbs(),
    selected: view.getBulkActionItems(),
    detailItem: view.getDetailItem(),
    dialog: state.dialog,
    cancellable: view.canCancelOperation,
    actions: view.opts.actions ?? [],
    toolbarActions: view.opts.toolbarActions ?? [],
    bulkActions: view.opts.bulkActions ?? [],
  })

  // Cached so the reference stays stable while nothing changed, as
  // `useSyncExternalStore` expects.
  let lastPluginState = plugin.getPluginState()
  let cachedSnapshot: S3ManagerSnapshot = {
    state: readState(lastPluginState),
    open: unlessBusy(view.openFolder, undefined),
    openPath: unlessBusy(
      (key: string | null) => plugin.openFolderPath(key),
      false,
    ),
    loadMore: unlessBusy(() => view.loadNextPage(), false),
    // Only the open folder is relisted: selections elsewhere survive, like
    // the plugin's own refreshListing().
    refresh: () => view.refreshCurrentFolder(),
    checkbox: (item, isShiftKeyPressed, visibleOrder) =>
      view.toggleCheckbox(item, isShiftKeyPressed, visibleOrder),
    cancelSelection: view.cancelSelection,
    openDetail: view.openItemDetail,
    closeDetail: view.closeItemDetail,
    runAction: unlessBusy(view.runAction, undefined),
    runToolbarAction: unlessBusy(view.runToolbarAction, undefined),
    runBulkAction: unlessBusy(view.runBulkAction, undefined),
    submitDialog: view.submitDialog,
    cancelDialog: view.cancelDialog,
    cancelOperation: view.cancelLongOperation,
    login: unlessBusy(
      (authFormData?: unknown) => view.handleAuth(authFormData),
      undefined,
    ),
    logout: unlessBusy(view.logout, undefined),
  }

  const getSnapshot = () => {
    // The plugin replaces its state object on every change, so the same
    // object means nothing to recompute (a logout whose request failed is
    // the one exception: it clears the selection roots without a state
    // change, and `selected` catches up on the next one). A plugin removed
    // while mounted reads as an empty state: the last snapshot stays.
    const state = plugin.getPluginState()
    if (!state.partialTree || state === lastPluginState) return cachedSnapshot
    lastPluginState = state
    const next = readState(state)
    if (!dequal(cachedSnapshot.state, next)) {
      cachedSnapshot = { ...cachedSnapshot, state: next }
    }
    return cachedSnapshot
  }

  const mount = () => {
    uppy.on('state-update', onStateUpdate)
    if (!didFirstRender) {
      // Once per controller: React StrictMode unmounts and mounts again with
      // the same one, and a second walk would abort the first.
      didFirstRender = true
      // A remount mid-move: listing now would abort the operation.
      if (view.canCancelOperation) walkPending = true
      else walk()
    } else if (walkPending) {
      walkWhenIdle()
    }
  }

  const unmount = () => {
    clearTimeout(walkTimer)
    uppy.off('state-update', onStateUpdate)
  }

  return { mount, unmount, subscribe: subscribers.add, getSnapshot }
}
