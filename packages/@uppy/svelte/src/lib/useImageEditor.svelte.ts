import {
  createImageEditorController,
  type ImageEditorSnapshot,
} from '@uppy/components'
import type { UppyFile } from '@uppy/core'
import { onDestroy, onMount } from 'svelte'
import { getUppyContext } from './components/headless/uppyContext.js'
import { useExternalStore } from './useSyncExternalStore.svelte.js'

type ImageEditorProps = {
  file: UppyFile<any, any>
}

type ButtonProps = {
  type: 'button'
  onclick: () => void
  disabled: boolean
  'aria-label': string
}

type ImageProps = ReturnType<ImageEditorSnapshot['getImageProps']>
type SvelteImageProps = Omit<ImageProps, 'onLoad'> & {
  onload: ImageProps['onLoad']
}

type SliderProps = {
  type: 'range'
  min: number
  max: number
  value: number
  onchange: (e: Event) => void
  'aria-label': string
}

type SvelteImageEditorSnapshot = {
  state: ImageEditorSnapshot['state']
  getImageProps: () => SvelteImageProps
  getSaveButtonProps: () => ButtonProps
  getCancelButtonProps: () => ButtonProps
  getRotateButtonProps: (degrees: number) => ButtonProps
  getFlipHorizontalButtonProps: () => ButtonProps
  getZoomButtonProps: (ratio: number) => ButtonProps
  getCropSquareButtonProps: () => ButtonProps
  getCropLandscapeButtonProps: () => ButtonProps
  getCropPortraitButtonProps: () => ButtonProps
  getResetButtonProps: () => ButtonProps
  getRotationSliderProps: () => SliderProps
}

export function useImageEditor(
  props: ImageEditorProps,
): SvelteImageEditorSnapshot {
  const ctx = getUppyContext()

  const controller = createImageEditorController(ctx.uppy, { file: props.file })
  const store = useExternalStore<ImageEditorSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  onMount(() => controller.start())
  onDestroy(() => controller.stop())

  return {
    get state() {
      return store.value.state
    },
    get getImageProps() {
      return () => {
        const { onLoad, ...rest } = store.value.getImageProps()
        return { ...rest, onload: onLoad }
      }
    },
    getSaveButtonProps: () => {
      const { onClick, ...rest } = store.value.getSaveButtonProps()
      return { ...rest, onclick: onClick }
    },
    getCancelButtonProps: () => {
      const { onClick, ...rest } = store.value.getCancelButtonProps()
      return { ...rest, onclick: onClick }
    },
    getRotateButtonProps: (degrees: number) => {
      const { onClick, ...rest } = store.value.getRotateButtonProps(degrees)
      return { ...rest, onclick: onClick }
    },
    getFlipHorizontalButtonProps: () => {
      const { onClick, ...rest } = store.value.getFlipHorizontalButtonProps()
      return { ...rest, onclick: onClick }
    },
    getZoomButtonProps: (ratio: number) => {
      const { onClick, ...rest } = store.value.getZoomButtonProps(ratio)
      return { ...rest, onclick: onClick }
    },
    getCropSquareButtonProps: () => {
      const { onClick, ...rest } = store.value.getCropSquareButtonProps()
      return { ...rest, onclick: onClick }
    },
    getCropLandscapeButtonProps: () => {
      const { onClick, ...rest } = store.value.getCropLandscapeButtonProps()
      return { ...rest, onclick: onClick }
    },
    getCropPortraitButtonProps: () => {
      const { onClick, ...rest } = store.value.getCropPortraitButtonProps()
      return { ...rest, onclick: onClick }
    },
    getResetButtonProps: () => {
      const { onClick, ...rest } = store.value.getResetButtonProps()
      return { ...rest, onclick: onClick }
    },
    getRotationSliderProps: () => {
      const { onChange, ...rest } = store.value.getRotationSliderProps()
      return { ...rest, onchange: onChange }
    },
  }
}
