import { inject, type ShallowRef } from 'vue'
import { createWebcamController, type WebcamSnapshot } from '@uppy/components'
import {
  UppyContextSymbol,
  type UppyContext,
} from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

type WebcamProps = {
  onSubmit?: () => void
}

export function useWebcam(props?: WebcamProps): ShallowRef<WebcamSnapshot> {
  const ctx = inject<UppyContext>(UppyContextSymbol)

  if (!ctx?.uppy) {
    throw new Error('useWebcam must be called within a UppyContextProvider')
  }

  const controller = createWebcamController(ctx.uppy, props?.onSubmit)
  const store = useExternalStore<WebcamSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  return store
}
