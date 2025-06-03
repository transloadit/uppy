import {
  createWebcamController,
  type WebcamSnapshot,
} from '@uppy/components'
import { useExternalStore } from './useSyncExternalStore.svelte.js'
import { getUppyContext } from './components/headless/uppyContext.js'
import type { HTMLButtonAttributes, HTMLVideoAttributes } from 'svelte/elements'
import { transformPreactToSelveteProps } from './transformProps.js'

type WebcamProps = {
  onSubmit?: () => void
}

export function useWebcam(props?: WebcamProps) {
  const ctx = getUppyContext()

  const controller = createWebcamController(ctx.uppy, props?.onSubmit)
  const store = useExternalStore<WebcamSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  const { getVideoProps, getSnapshotButtonProps, getRecordButtonProps, getStopRecordingButtonProps, getSubmitButtonProps, getDiscardButtonProps, ...rest } = store.value

  return {
    getVideoProps: (): HTMLVideoAttributes => transformPreactToSelveteProps(getVideoProps()),
    getSnapshotButtonProps: (): HTMLButtonAttributes => transformPreactToSelveteProps(getSnapshotButtonProps()),
    getRecordButtonProps: (): HTMLButtonAttributes => transformPreactToSelveteProps(getRecordButtonProps()),
    getStopRecordingButtonProps: (): HTMLButtonAttributes => transformPreactToSelveteProps(getStopRecordingButtonProps()),
    getSubmitButtonProps: (): HTMLButtonAttributes => transformPreactToSelveteProps(getSubmitButtonProps()),
    getDiscardButtonProps: (): HTMLButtonAttributes => transformPreactToSelveteProps(getDiscardButtonProps()),
    ...rest,
  }
}
