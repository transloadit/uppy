import type Uppy from '@uppy/core'
import type {
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
  ProviderDialogState,
  UnknownProviderPlugin,
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
 * also in minor releases. These types are the hook's own: what computes
 * them (ProviderView today) can be replaced without changing them.
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
  selectionActive: boolean
  /** Whether `cancelOperation` has a running move or bulk change to stop. */
  cancellable: boolean
  actions: ProviderAction<any, any>[]
  toolbarActions: ProviderToolbarAction<any, any>[]
  bulkActions: ProviderBulkAction<any, any>[]
}

/** @experimental See `S3ManagerState`. */
export type S3ManagerSnapshot = {
  state: S3ManagerState
  /** Open a folder by item id. */
  open: (folderId: PartialTreeId) => Promise<void>
  /** Open a folder by key (e.g. `docs/photos/`); false when it doesn't exist. */
  openPath: (key: string | null) => Promise<boolean>
  /** Load the open folder's next page; false when there is none. */
  loadMore: () => Promise<boolean>
  refresh: () => Promise<void>
  /** `visibleOrder` is the rows as shown (sorted, filtered), for shift-click ranges. */
  checkbox: (
    item: S3ManagerItem,
    isShiftKeyPressed: boolean,
    visibleOrder?: S3ManagerItem[],
  ) => void
  cancelSelection: () => void
  toggleSelectionMode: () => void
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
  login: () => Promise<void>
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

/** @experimental See `S3ManagerSnapshot`. */
export function createS3ManagerController(
  uppy: Uppy<any, any>,
  pluginId: string,
  { initialFolderKey = null }: { initialFolderKey?: string | null } = {},
): S3ManagerStore {
  const plugin = uppy.getPlugin<StoragePlugin>(pluginId)
  if (!plugin) throw new Error(`(${pluginId}) is not installed`)
  const view = plugin.view as ProviderViews<any, any>
  const subscribers = new Subscribers()
  let didFirstRender = false
  let lastDetail: S3ManagerItem | undefined

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    _prev,
    _next,
    patch,
  ) => {
    if (patch?.plugins?.[pluginId]) subscribers.emit()
  }

  const readState = (): S3ManagerState => {
    const state = plugin.getPluginState()
    const partialTree = view.getDisplayedPartialTree()
    const found = partialTree.find(({ id }) => id === state.detailItemId)
    // A refresh empties the folder until it is listed again: keep the item
    // meanwhile. ProviderView closes the detail if the listing lost it.
    if (found || lastDetail?.id !== state.detailItemId) lastDetail = found
    return {
      authenticated: state.authenticated,
      loading: state.loading,
      currentFolderId: state.currentFolderId,
      partialTree,
      breadcrumbs: view.getBreadcrumbs(),
      selected: view.getBulkActionItems(),
      detailItem: lastDetail,
      dialog: state.dialog,
      selectionActive: state.selectionActive ?? false,
      cancellable: view.canCancelOperation,
      actions: view.opts.actions ?? [],
      toolbarActions: view.opts.toolbarActions ?? [],
      bulkActions: view.opts.bulkActions ?? [],
    }
  }

  // Cached so the reference stays stable while nothing changed, as
  // `useSyncExternalStore` expects.
  let cachedSnapshot: S3ManagerSnapshot = {
    state: readState(),
    open: view.openFolder,
    openPath: (key) => plugin.openFolderPath(key),
    loadMore: () => view.loadNextPage(),
    refresh: () => view.refreshCurrentFolder(true),
    checkbox: (item, isShiftKeyPressed, visibleOrder) =>
      view.toggleCheckbox(item, isShiftKeyPressed, visibleOrder),
    cancelSelection: view.cancelSelection,
    toggleSelectionMode: view.toggleSelectionMode,
    openDetail: view.openItemDetail,
    closeDetail: view.closeItemDetail,
    runAction: view.runAction,
    runToolbarAction: view.runToolbarAction,
    runBulkAction: view.runBulkAction,
    submitDialog: view.submitDialog,
    cancelDialog: view.cancelDialog,
    cancelOperation: view.cancelLongOperation,
    login: () => view.handleAuth(),
    logout: view.logout,
  }

  const getSnapshot = () => {
    const state = readState()
    if (!dequal(cachedSnapshot.state, state))
      cachedSnapshot = { ...cachedSnapshot, state }
    return cachedSnapshot
  }

  const mount = () => {
    uppy.on('state-update', onStateUpdate)
    if (!didFirstRender) {
      didFirstRender = true
      // Logs in when needed and lists the folder without a rendered panel.
      plugin.openFolderPath(initialFolderKey).catch((err: unknown) => {
        uppy.log(`[${pluginId}] could not open the folder: ${err}`, 'warning')
      })
    }
  }

  const unmount = () => {
    didFirstRender = false
    uppy.off('state-update', onStateUpdate)
  }

  return { mount, unmount, subscribe: subscribers.add, getSnapshot }
}
