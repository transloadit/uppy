import { getContext } from 'svelte'
import {
  createWebcamController,
  type WebcamSnapshot,
  type UppyContext,
} from '@uppy/components'
import { UppyContextKey } from './components/headless/UppyContextProvider.svelte'
import { useExternalStore } from './useSyncExternalStore.svelte.js'

type WebcamProps = {
  onSubmit?: () => void
}

type ButtonProps = {
  type: 'button'
  onclick: () => void
  disabled: boolean
}

type SvelteWebcamSnapshot = {
  state: WebcamSnapshot['state']
  stop: () => void
  start: () => void
  getVideoProps: () => ReturnType<WebcamSnapshot['getVideoProps']>
  getSnapshotButtonProps: () => ButtonProps
  getRecordButtonProps: () => ButtonProps
  getStopRecordingButtonProps: () => ButtonProps
  getSubmitButtonProps: () => ButtonProps
  getDiscardButtonProps: () => ButtonProps
}

export function useWebcam(props?: WebcamProps): SvelteWebcamSnapshot {
  const ctx = getContext<UppyContext>(UppyContextKey)

  if (!ctx?.uppy) {
    throw new Error('useWebcam must be called within a UppyContextProvider')
  }

  const controller = createWebcamController(ctx.uppy, props?.onSubmit)
  const store = useExternalStore<WebcamSnapshot>(
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
    getSnapshotButtonProps: () => {
      const { onClick, ...rest } = store.value.getSnapshotButtonProps()
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
