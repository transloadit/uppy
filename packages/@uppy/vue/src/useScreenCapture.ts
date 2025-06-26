import {
  createScreenCaptureController,
  type ScreenCaptureSnapshot,
} from '@uppy/components'
import type { ShallowRef } from 'vue'
import { injectUppyContext } from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

type ScreenCaptureProps = {
  onSubmit?: () => void
}

export function useScreenCapture(
  props?: ScreenCaptureProps,
): ShallowRef<ScreenCaptureSnapshot> {
  const ctx = injectUppyContext()

  const controller = createScreenCaptureController(ctx.uppy, props?.onSubmit)
  const store = useExternalStore<ScreenCaptureSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  return store
}
