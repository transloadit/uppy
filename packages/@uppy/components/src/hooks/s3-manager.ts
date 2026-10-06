import type Uppy from '@uppy/core'
import type {
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
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

type Item = PartialTreeFile | PartialTreeFolderNode

/**
 * @experimental A headless manager-mode storage browser (`@uppy/s3`,
 * `@uppy/transloadit-storage`). It will change incompatibly, also in minor
 * releases.
 */
export type S3ManagerSnapshot = {
  state: Omit<UnknownProviderPluginState, 'partialTree'> & {
    /** The open folder's items, not the whole tree. */
    partialTree: Item[]
    breadcrumbs: PartialTreeFolder[]
    /** What a bulk action runs on: the checked items, top-most only. */
    selected: Item[]
    /** Kept while a refresh relists its folder; cleared when it is gone. */
    detailItem: Item | undefined
    /** Whether `cancelOperation` has a running move or bulk change to stop. */
    cancellable: boolean
    actions: ProviderAction<any, any>[]
    toolbarActions: ProviderToolbarAction<any, any>[]
    bulkActions: ProviderBulkAction<any, any>[]
  }
  open: ProviderViews<any, any>['openFolder']
  /** Open a folder by key (e.g. `docs/photos/`); false when it doesn't exist. */
  openPath: (key: string | null) => Promise<boolean>
  loadMore: ProviderViews<any, any>['loadNextPage']
  refresh: () => Promise<void>
  checkbox: ProviderViews<any, any>['toggleCheckbox']
  cancelSelection: ProviderViews<any, any>['cancelSelection']
  toggleSelectionMode: ProviderViews<any, any>['toggleSelectionMode']
  openDetail: ProviderViews<any, any>['openItemDetail']
  closeDetail: ProviderViews<any, any>['closeItemDetail']
  runAction: ProviderViews<any, any>['runAction']
  runToolbarAction: ProviderViews<any, any>['runToolbarAction']
  runBulkAction: ProviderViews<any, any>['runBulkAction']
  submitDialog: ProviderViews<any, any>['submitDialog']
  cancelDialog: ProviderViews<any, any>['cancelDialog']
  /** Stop a running move or bulk change (`state.loading` is set meanwhile). */
  cancelOperation: ProviderViews<any, any>['cancelLongOperation']
  login: ProviderViews<any, any>['handleAuth']
  logout: ProviderViews<any, any>['logout']
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
  let lastDetail: Item | undefined

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    _prev,
    _next,
    patch,
  ) => {
    if (patch?.plugins?.[pluginId]) subscribers.emit()
  }

  const readState = (): S3ManagerSnapshot['state'] => {
    const state = plugin.getPluginState()
    const partialTree = view.getDisplayedPartialTree()
    const found = partialTree.find(({ id }) => id === state.detailItemId)
    // A refresh empties the folder until it is listed again: keep the item
    // meanwhile. ProviderView closes the detail if the listing lost it.
    if (found || lastDetail?.id !== state.detailItemId) lastDetail = found
    return {
      ...state,
      partialTree,
      breadcrumbs: view.getBreadcrumbs(),
      selected: view.getBulkActionItems(),
      detailItem: lastDetail,
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
    loadMore: view.loadNextPage.bind(view),
    refresh: () => view.refreshCurrentFolder(true),
    checkbox: view.toggleCheckbox,
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
    login: view.handleAuth,
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
