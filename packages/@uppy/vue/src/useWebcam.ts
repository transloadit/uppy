import { computed, inject, onMounted, type ComputedRef } from 'vue'
import { createWebcamStore, type WebcamSnapshot } from '@uppy/components'
import {
  UppyContextSymbol,
  type UppyContext,
} from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

type UseWebcamResult = {
  state: ComputedRef<WebcamSnapshot['state']>
  getVideoProps: ComputedRef<WebcamSnapshot['getVideoProps']>
  getSnapshotButtonProps: ComputedRef<WebcamSnapshot['getSnapshotButtonProps']>
  getRecordButtonProps: ComputedRef<WebcamSnapshot['getRecordButtonProps']>
  getStopRecordingButtonProps: ComputedRef<
    WebcamSnapshot['getStopRecordingButtonProps']
  >
  getSubmitButtonProps: ComputedRef<WebcamSnapshot['getSubmitButtonProps']>
  getDiscardButtonProps: ComputedRef<WebcamSnapshot['getSubmitButtonProps']>
}
export function useWebcam(): UseWebcamResult {
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

  return {
    state: computed(() => store.value.state),
    getVideoProps: computed(() => store.value.getVideoProps),
    getSnapshotButtonProps: computed(() => store.value.getSnapshotButtonProps),
    getRecordButtonProps: computed(() => store.value.getRecordButtonProps),
    getStopRecordingButtonProps: computed(
      () => store.value.getStopRecordingButtonProps,
    ),
    getSubmitButtonProps: computed(() => store.value.getSubmitButtonProps),
    getDiscardButtonProps: computed(() => store.value.getDiscardButtonProps),
  }
}
