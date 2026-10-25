import type Uppy from '@uppy/core'
import type {
  PartialTreeFolder,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  UppyEventMap,
} from '@uppy/core'
import type { ProviderViews } from '@uppy/core/provider-views'
import { dequal } from 'dequal/lite'
import { Subscribers } from './utils.js'

export type RemoteSourceKeys =
  | 'Box'
  | 'Dropbox'
  | 'Facebook'
  | 'GoogleDrive'
  | 'OneDrive'
  | 'Unsplash'
  | 'Url'
  | 'Zoom'

export type RemoteSourceSnapshot = {
  state: UnknownProviderPluginState & {
    breadcrumbs: PartialTreeFolder[]
    selectedAmount: number
    error: string | null
  }
  login: ProviderViews<any, any>['handleAuth']
  logout: ProviderViews<any, any>['logout']
  open: ProviderViews<any, any>['openFolder']
  checkbox: ProviderViews<any, any>['toggleCheckbox']
  /** Adds the selected files, then calls `onClose` if they were added. */
  done: () => Promise<void>
  /** Clears the selection, then calls `onClose`. */
  cancel: () => void
}

export type RemoteSourceOptions = {
  onClose?: (() => void) | undefined
}

export type RemoteSourceStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => RemoteSourceSnapshot
  mount: () => void
  unmount: () => void
}

export function createRemoteSourceController(
  uppy: Uppy,
  sourceId: RemoteSourceKeys,
  options?: RemoteSourceOptions,
): RemoteSourceStore {
  const plugin = uppy.getPlugin<UnknownProviderPlugin<any, any>>(sourceId)
  if (!plugin) {
    throw new Error(
      `(${sourceId}) is not installed. Install the plugin or the preset @uppy/remote-sources and add it to the Uppy instance`,
    )
  }
  const subscribers = new Subscribers()
  const view = plugin.view as ProviderViews<any, any>
  let mounted = false

  const cancel = () => {
    view.cancelSelection()
    options?.onClose?.()
  }

  const done = async () => {
    // The consumer may have unmounted while files were added, and `onClose`
    // could now close something else
    if ((await view.donePicking()) && mounted) options?.onClose?.()
  }

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
  ) => {
    // `error` also depends on the files already added to Uppy
    if (
      prev.plugins[sourceId] !== next.plugins[sourceId] ||
      prev.files !== next.files
    ) {
      subscribers.emit()
    }
  }

  // Keep a cached snapshot so that the reference stays stable when nothing
  // has changed, as expected by `useSyncExternalStore` from React
  let cachedSnapshot: RemoteSourceSnapshot = {
    state: {
      ...plugin.getPluginState(),
      // By default the partialTree is an array of all folders you have opened at some point,
      // not the contents of the current folder. We filter it here to make it more intuitive to work with.
      partialTree: view.getDisplayedPartialTree(),
      selectedAmount: view.getSelectedAmount(),
      error: view.validateAggregateRestrictions(
        plugin.getPluginState().partialTree,
      ),
      breadcrumbs: view.getBreadcrumbs(),
    },
    login: view?.handleAuth,
    logout: view?.logout,
    open: view?.openFolder,
    checkbox: view?.toggleCheckbox,
    done,
    cancel,
  }
  const getSnapshot = () => {
    const nextSnapshot = {
      ...cachedSnapshot,
      state: {
        ...plugin.getPluginState(),
        partialTree: view.getDisplayedPartialTree(),
        selectedAmount: view.getSelectedAmount(),
        error: view.validateAggregateRestrictions(
          plugin.getPluginState().partialTree,
        ),
        breadcrumbs: view.getBreadcrumbs(),
      },
    }

    if (!dequal(cachedSnapshot.state, nextSnapshot.state)) {
      cachedSnapshot = nextSnapshot
    }

    return cachedSnapshot
  }

  const mount = () => {
    uppy.on('state-update', onStateUpdate)

    if (!mounted) {
      view.openFolder?.(plugin.rootFolderId)
      view.provider.fetchPreAuthToken?.()
      mounted = true
    }
  }

  const unmount = () => {
    mounted = false
    uppy.off('state-update', onStateUpdate)
  }

  return {
    mount,
    unmount,
    subscribe: subscribers.add,
    getSnapshot,
  }
}
