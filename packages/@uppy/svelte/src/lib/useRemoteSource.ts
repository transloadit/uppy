import {
  createRemoteSourceController,
  type RemoteSourceSnapshot,
  type RemoteSourceKeys,
} from '@uppy/components'
import { useExternalStore } from './useSyncExternalStore.svelte.js'
import { getUppyContext } from './components/headless/uppyContext.js'

export function useRemoteSource(
  sourceId: RemoteSourceKeys,
): RemoteSourceSnapshot {
  const ctx = getUppyContext()
  const controller = createRemoteSourceController(ctx.uppy, sourceId)
  const store = useExternalStore<RemoteSourceSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  return store
}
