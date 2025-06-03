import { type ShallowRef } from 'vue'
import { createWebcamController, type WebcamSnapshot } from '@uppy/components'
import { injectUppyContext } from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

type WebcamProps = {
  onSubmit?: () => void
}

export function useWebcam(props?: WebcamProps): ShallowRef<WebcamSnapshot> {
  const ctx = injectUppyContext()

  const controller = createWebcamController(ctx.uppy, props?.onSubmit)
  const store = useExternalStore<WebcamSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  return store
}
