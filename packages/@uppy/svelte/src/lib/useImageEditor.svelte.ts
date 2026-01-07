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
  getImageProps: () => ReturnType<ImageEditorSnapshot['getImageProps']>
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

  // Helper to convert onClick to onclick for Svelte
  const adaptButtonProps = (
    getProps: () => ReturnType<ImageEditorSnapshot['getSaveButtonProps']>,
  ) => {
    return () => {
      const { onClick, ...rest } = getProps()
      return { ...rest, onclick: onClick }
    }
  }

  // Helper for button props that take a parameter
  const adaptButtonPropsWithParam = <T,>(
    getProps: (param: T) => ReturnType<ImageEditorSnapshot['getSaveButtonProps']>,
  ) => {
    return (param: T) => {
      const { onClick, ...rest } = getProps(param)
      return { ...rest, onclick: onClick }
    }
  }

  // Helper to convert onChange to onchange for Svelte
  const adaptSliderProps = (
    getProps: () => ReturnType<ImageEditorSnapshot['getRotationSliderProps']>,
  ) => {
    return () => {
      const { onChange, ...rest } = getProps()
      return { ...rest, onchange: onChange }
    }
  }

  return {
    get state() {
      return store.value.state
    },
    get getImageProps() {
      return store.value.getImageProps
    },
    getSaveButtonProps: adaptButtonProps(() =>
      store.value.getSaveButtonProps(),
    ),
    getCancelButtonProps: adaptButtonProps(() =>
      store.value.getCancelButtonProps(),
    ),
    getRotateButtonProps: adaptButtonPropsWithParam((degrees: number) =>
      store.value.getRotateButtonProps(degrees),
    ),
    getFlipHorizontalButtonProps: adaptButtonProps(() =>
      store.value.getFlipHorizontalButtonProps(),
    ),
    getZoomButtonProps: adaptButtonPropsWithParam((ratio: number) =>
      store.value.getZoomButtonProps(ratio),
    ),
    getCropSquareButtonProps: adaptButtonProps(() =>
      store.value.getCropSquareButtonProps(),
    ),
    getCropLandscapeButtonProps: adaptButtonProps(() =>
      store.value.getCropLandscapeButtonProps(),
    ),
    getCropPortraitButtonProps: adaptButtonProps(() =>
      store.value.getCropPortraitButtonProps(),
    ),
    getResetButtonProps: adaptButtonProps(() =>
      store.value.getResetButtonProps(),
    ),
    getRotationSliderProps: adaptSliderProps(() =>
      store.value.getRotationSliderProps(),
    ),
  }
}
