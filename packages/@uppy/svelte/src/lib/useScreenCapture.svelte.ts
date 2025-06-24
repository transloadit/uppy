import {
  createScreenCaptureController,
  type ScreenCaptureSnapshot,
} from '@uppy/components'
import { useExternalStore } from './useSyncExternalStore.svelte.js'
import { getUppyContext } from './components/headless/uppyContext.js'

type ScreenCaptureProps = {
  onSubmit?: () => void
}

type ButtonProps = {
  type: 'button'
  onclick: () => void
  disabled: boolean
}

type SvelteScreenCaptureSnapshot = {
  state: ScreenCaptureSnapshot['state']
  stop: () => void
  start: () => void
  getVideoProps: () => ReturnType<ScreenCaptureSnapshot['getVideoProps']>
  getScreenshotButtonProps: () => ButtonProps
  getRecordButtonProps: () => ButtonProps
  getStopRecordingButtonProps: () => ButtonProps
  getSubmitButtonProps: () => ButtonProps
  getDiscardButtonProps: () => ButtonProps
}

export function useScreenCapture(props?: ScreenCaptureProps): SvelteScreenCaptureSnapshot {
  const ctx = getUppyContext()

  const controller = createScreenCaptureController(ctx.uppy, props?.onSubmit)
  const store = useExternalStore<ScreenCaptureSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  return {
    get state() {
      return store.value.state
    },
    get stop() {
      return store.value.stop
    },
    get start() {
      return store.value.start
    },
    get getVideoProps() {
      return store.value.getVideoProps
    },
    getScreenshotButtonProps: () => {
      const { onClick, ...rest } = store.value.getScreenshotButtonProps()
      return { ...rest, onclick: onClick }
    },
    getRecordButtonProps: () => {
      const { onClick, ...rest } = store.value.getRecordButtonProps()
      return { ...rest, onclick: onClick }
    },
    getStopRecordingButtonProps: () => {
      const { onClick, ...rest } = store.value.getStopRecordingButtonProps()
      return { ...rest, onclick: onClick }
    },
    getSubmitButtonProps: () => {
      const { onClick, ...rest } = store.value.getSubmitButtonProps()
      return { ...rest, onclick: onClick }
    },
    getDiscardButtonProps: () => {
      const { onClick, ...rest } = store.value.getDiscardButtonProps()
      return { ...rest, onclick: onClick }
    },
  }
}
