import { inject, onMounted, type ShallowRef } from 'vue'
import { createWebcamStore, type WebcamSnapshot } from '@uppy/components'
import {
  UppyContextSymbol,
  type UppyContext,
} from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

export function useWebcam(): ShallowRef<WebcamSnapshot> {
  const ctx = inject<UppyContext>(UppyContextSymbol)

  if (!ctx?.uppy) {
    throw new Error('useWebcam must be called within a UppyContextProvider')
  }

  const webcam = createWebcamStore(ctx.uppy)
  const store = useExternalStore<WebcamSnapshot>(
    webcam.getSnapshot,
    webcam.subscribe,
  )

  onMounted(() => {
    webcam.start()

    return () => {
      webcam.destroy()
    }
  })

  return store
}
