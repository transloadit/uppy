import type Uppy from '@uppy/core'
import type {
  PartialTreeFolder,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  UppyEventMap,
} from '@uppy/core'
import type { ProviderViews } from '@uppy/provider-views'
import type { AvailablePluginsKeys } from '@uppy/remote-sources'
import { dequal } from 'dequal/lite'
import { Subscribers } from './utils.js'

export type { AvailablePluginsKeys as RemoteSourceKeys }

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
  done: ProviderViews<any, any>['donePicking']
  cancel: ProviderViews<any, any>['cancelSelection']
}

export type RemoteSourceStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => RemoteSourceSnapshot
  mount: () => void
  unmount: () => void
}

export function createRemoteSourceController(
  uppy: Uppy,
  sourceId: AvailablePluginsKeys,
): RemoteSourceStore {
  const plugin = uppy.getPlugin<UnknownProviderPlugin<any, any>>(sourceId)
  if (!plugin) {
    throw new Error(
      `(${sourceId}) is not installed. Install the plugin or the preset @uppy/remote-sources and add it to the Uppy instance`,
    )
  }
  const subscribers = new Subscribers()
  const view = plugin.view as ProviderViews<any, any>
  let didFirstRender = false

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
    patch,
  ) => {
    if (patch?.plugins?.[sourceId]) {
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
    done: view?.donePicking,
    cancel: view?.cancelSelection,
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

    if (!didFirstRender) {
      view.openFolder?.(plugin.rootFolderId)
      view.provider.fetchPreAuthToken?.()
      didFirstRender = true
    }
  }

  const unmount = () => {
    didFirstRender = false
    uppy.off('state-update', onStateUpdate)
  }

  return {
    mount,
    unmount,
    subscribe: subscribers.add,
    getSnapshot,
  }
}
