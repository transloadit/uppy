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
export type StorageManagerSnapshot = {
  state: Omit<UnknownProviderPluginState, 'partialTree'> & {
    /** The open folder's items, not the whole tree. */
    partialTree: Item[]
    breadcrumbs: PartialTreeFolder[]
    /** What a bulk action runs on: the checked items, top-most only. */
    selected: Item[]
    detailItem: Item | undefined
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

/** @experimental See `StorageManagerSnapshot`. */
export type StorageManagerStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => StorageManagerSnapshot
  mount: () => void
  unmount: () => void
}

type StoragePlugin = UnknownProviderPlugin<any, any> & {
  openFolderPath(key: string | null): Promise<boolean>
}

/** @experimental See `StorageManagerSnapshot`. */
export function createStorageManagerController(
  uppy: Uppy<any, any>,
  pluginId: string,
  { initialFolderKey = null }: { initialFolderKey?: string | null } = {},
): StorageManagerStore {
  const plugin = uppy.getPlugin<StoragePlugin>(pluginId)
  if (!plugin) throw new Error(`(${pluginId}) is not installed`)
  const view = plugin.view as ProviderViews<any, any>
  const subscribers = new Subscribers()
  let didFirstRender = false

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    _prev,
    _next,
    patch,
  ) => {
    if (patch?.plugins?.[pluginId]) subscribers.emit()
  }

  const readState = (): StorageManagerSnapshot['state'] => {
    const state = plugin.getPluginState()
    return {
      ...state,
      partialTree: view.getDisplayedPartialTree(),
      breadcrumbs: view.getBreadcrumbs(),
      selected: view.getBulkActionItems(),
      // ponytail: blank while a refresh relists the item's folder; keep the last item in the UI if that flickers.
      detailItem: view
        .getDisplayedPartialTree()
        .find(({ id }) => id === state.detailItemId),
      actions: view.opts.actions ?? [],
      toolbarActions: view.opts.toolbarActions ?? [],
      bulkActions: view.opts.bulkActions ?? [],
    }
  }

  // Cached so the reference stays stable while nothing changed, as
  // `useSyncExternalStore` expects.
  let cachedSnapshot: StorageManagerSnapshot = {
    state: readState(),
    open: view.openFolder.bind(view),
    openPath: (key) => plugin.openFolderPath(key),
    loadMore: view.loadNextPage.bind(view),
    refresh: () => view.refreshCurrentFolder(true),
    checkbox: view.toggleCheckbox.bind(view),
    cancelSelection: view.cancelSelection.bind(view),
    toggleSelectionMode: view.toggleSelectionMode,
    openDetail: view.openItemDetail,
    closeDetail: view.closeItemDetail,
    runAction: view.runAction,
    runToolbarAction: view.runToolbarAction,
    runBulkAction: view.runBulkAction,
    submitDialog: view.submitDialog,
    cancelDialog: view.cancelDialog,
    cancelOperation: view.cancelLongOperation,
    login: view.handleAuth.bind(view),
    logout: view.logout.bind(view),
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
