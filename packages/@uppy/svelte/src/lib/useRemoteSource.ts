import {
  createRemoteSourceController,
  type RemoteSourceSnapshot,
  type RemoteSourceKeys,
} from '@uppy/components'
import { useExternalStore } from './useSyncExternalStore.svelte.js'
import { getUppyContext } from './components/headless/uppyContext.js'
import { onMount, onDestroy } from 'svelte'

export function useRemoteSource(
  sourceId: RemoteSourceKeys,
): RemoteSourceSnapshot {
  const ctx = getUppyContext()
  const controller = createRemoteSourceController(ctx.uppy, sourceId)
  const store = useExternalStore<RemoteSourceSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  onMount(() => {
    controller.mount()
  })

  onDestroy(() => {
    controller.unmount()
  })

  // Using getters like this was the only way to maintain reactivity
  return {
    get state() {
      return store.value.state
    },
    get login() {
      return store.value.login
    },
    get logout() {
      return store.value.logout
    },
    get open() {
      return store.value.open
    },
    get checkbox() {
      return store.value.checkbox
    },
    get done() {
      return store.value.done
    },
    get cancel() {
      return store.value.cancel
    },
  }
}
