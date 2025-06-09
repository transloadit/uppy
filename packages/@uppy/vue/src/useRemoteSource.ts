import { type ShallowRef, onMounted, onUnmounted } from 'vue'
import {
  createRemoteSourceController,
  type RemoteSourceSnapshot,
  type RemoteSourceKeys,
} from '@uppy/components'
import { injectUppyContext } from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

export function useRemoteSource(
  sourceId: RemoteSourceKeys,
): ShallowRef<RemoteSourceSnapshot> {
  const ctx = injectUppyContext()

  const controller = createRemoteSourceController(ctx.uppy, sourceId)
  const store = useExternalStore<RemoteSourceSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  onMounted(() => {
    controller.mount()
  })

  onUnmounted(() => {
    controller.unmount()
  })

  return store
}
