import type { Body, Meta, Uppy, UppyEventMap, UppyFile } from '@uppy/core'
import type ImageEditor from '@uppy/image-editor'
import type { AspectRatio } from '@uppy/image-editor'
import { Subscribers } from './utils.js'

export type { AspectRatio } from '@uppy/image-editor'

export type ImageEditorState = {
  angle: number
  isFlippedHorizontally: boolean
  aspectRatio: AspectRatio
}

type ButtonProps = {
  type: 'button'
  onClick: () => void
  disabled: boolean
  'aria-label': string
}

type SliderProps = {
  type: 'range'
  min: number
  max: number
  value: number
  onChange: (e: Event) => void
  'aria-label': string
}

export type ImageEditorSnapshot = {
  state: ImageEditorState
  getImageProps: () => {
    id: string
    src: string
    alt: string
  }
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

export type ImageEditorStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => ImageEditorSnapshot
  start: () => void
  stop: () => void
}

const imgElementId = 'uppy-image-editor-image'

export function createImageEditorController<M extends Meta, B extends Body>(
  uppy: Uppy<M, B>,
  options: { file: UppyFile<M, B>; onSubmit?: () => void },
): ImageEditorStore {
  const plugin = uppy.getPlugin<ImageEditor<M, B>>('ImageEditor')

  if (!plugin) {
    throw new Error(
      'ImageEditor plugin is not installed. Install @uppy/image-editor and add it to the Uppy instance with `uppy.use(ImageEditor)`.',
    )
  }

  const { onSubmit } = options
  // Get fresh file from Uppy state to ensure we have the latest data including blob
  const file = uppy.getFile(options.file.id) ?? options.file

  const subscribers = new Subscribers()

  const onStateUpdate: UppyEventMap<M, B>['state-update'] = (
    _prev,
    _next,
    patch,
  ) => {
    const editorPatch = patch?.plugins?.ImageEditor
    if (editorPatch) {
      subscribers.emit()
    }
  }

  const start = () => {
    uppy.on('state-update', onStateUpdate)
    plugin.start(file)
  }

  const stop = () => {
    uppy.off('state-update', onStateUpdate)
    plugin.stop()
  }

  const ensureCropper = (): boolean => {
    if (plugin.cropper) return true

    const imgElement = document.getElementById(
      imgElementId,
    ) as HTMLImageElement | null
    if (!imgElement) {
      throw new Error(
        'Could not find image element. This likely means you are not using `getImageProps` correctly.',
      )
    }

    plugin.initCropper(imgElement)
    return true
  }

  // Actions
  const save = (): void => {
    if (!plugin.cropper) return
    plugin.save()
    onSubmit?.()
  }

  const cancel = (): void => {
    uppy.emit('file-editor:cancel', file)
  }

  const rotateBy = (degrees: number): void => {
    if (!ensureCropper()) return
    plugin.rotateBy(degrees)
  }

  const rotateGranular = (degrees: number): void => {
    if (!ensureCropper()) return
    plugin.rotateGranular(degrees)
  }

  const flipHorizontal = (): void => {
    if (!ensureCropper()) return
    plugin.flipHorizontal()
  }

  const zoom = (ratio: number): void => {
    if (!ensureCropper()) return
    plugin.zoom(ratio)
  }

  const setAspectRatio = (newRatio: AspectRatio): void => {
    if (!ensureCropper()) return
    plugin.setAspectRatio(newRatio)
  }

  const reset = (): void => {
    if (!ensureCropper()) return
    plugin.reset()
  }

  // Props getters
  const getImageProps = () => ({
    id: imgElementId,
    src: plugin.getObjectUrl() ?? '',
    alt: file.name ?? '',
  })

  const isCropperReady = () => plugin.cropper != null

  const getSaveButtonProps = (): ButtonProps => ({
    type: 'button',
    onClick: save,
    disabled: !isCropperReady(),
    'aria-label': 'Save changes',
  })

  const getCancelButtonProps = (): ButtonProps => ({
    type: 'button',
    onClick: cancel,
    disabled: false,
    'aria-label': 'Cancel editing',
  })

  const getRotateButtonProps = (degrees: number): ButtonProps => ({
    type: 'button',
    onClick: () => rotateBy(degrees),
    disabled: !isCropperReady(),
    'aria-label': `Rotate ${degrees} degrees`,
  })

  const getFlipHorizontalButtonProps = (): ButtonProps => ({
    type: 'button',
    onClick: flipHorizontal,
    disabled: !isCropperReady(),
    'aria-label': 'Flip horizontally',
  })

  const getZoomButtonProps = (ratio: number): ButtonProps => ({
    type: 'button',
    onClick: () => zoom(ratio),
    disabled: !isCropperReady(),
    'aria-label': ratio > 0 ? 'Zoom in' : 'Zoom out',
  })

  const getCropSquareButtonProps = (): ButtonProps => ({
    type: 'button',
    onClick: () => setAspectRatio('1:1'),
    disabled: !isCropperReady(),
    'aria-label': 'Crop square (1:1)',
  })

  const getCropLandscapeButtonProps = (): ButtonProps => ({
    type: 'button',
    onClick: () => setAspectRatio('16:9'),
    disabled: !isCropperReady(),
    'aria-label': 'Crop landscape (16:9)',
  })

  const getCropPortraitButtonProps = (): ButtonProps => ({
    type: 'button',
    onClick: () => setAspectRatio('9:16'),
    disabled: !isCropperReady(),
    'aria-label': 'Crop portrait (9:16)',
  })

  const getResetButtonProps = (): ButtonProps => ({
    type: 'button',
    onClick: reset,
    disabled: !isCropperReady(),
    'aria-label': 'Reset all changes',
  })

  const getRotationSliderProps = (): SliderProps => ({
    type: 'range',
    min: -45,
    max: 45,
    value: plugin.getPluginState().angleGranular,
    onChange: (e: Event) => {
      const granularAngle = Number((e.target as HTMLInputElement).value)
      rotateGranular(granularAngle)
    },
    'aria-label': 'Fine rotation adjustment',
  })

  const getSnapshot = (
    pluginState = plugin.getPluginState(),
  ): ImageEditorSnapshot => ({
    state: {
      angle: pluginState.angle,
      isFlippedHorizontally: pluginState.isFlippedHorizontally,
      aspectRatio: pluginState.aspectRatio,
    },
    getImageProps,
    getSaveButtonProps,
    getCancelButtonProps,
    getRotateButtonProps,
    getFlipHorizontalButtonProps,
    getZoomButtonProps,
    getCropSquareButtonProps,
    getCropLandscapeButtonProps,
    getCropPortraitButtonProps,
    getResetButtonProps,
    getRotationSliderProps,
  })

  let cachedPluginState = plugin.getPluginState()
  let cachedSnapshot = getSnapshot(cachedPluginState)

  const getCachedSnapshot = (): ImageEditorSnapshot => {
    const pluginState = plugin.getPluginState()
    if (pluginState === cachedPluginState) return cachedSnapshot

    cachedPluginState = pluginState
    cachedSnapshot = getSnapshot(pluginState)
    return cachedSnapshot
  }

  return {
    subscribe: subscribers.add,
    getSnapshot: getCachedSnapshot,
    start,
    stop,
  }
}
