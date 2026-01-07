import type { Uppy, UppyEventMap, UppyFile } from '@uppy/core'
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

type ButtonClickOptions = {
  onClick?: () => void
}

type SliderProps<EventType extends Event = Event> = {
  type: 'range'
  min: number
  max: number
  value: number
  onChange: (e: EventType) => void
  'aria-label': string
}

type ImageProps<EventType extends Event = Event> = {
  id: string
  src: string
  alt: string
  onLoad: (e: EventType) => void
}

export type ImageEditorSnapshot<
  ImageEventType extends Event = Event,
  SliderEventType extends Event = Event,
> = {
  state: ImageEditorState
  getImageProps: () => ImageProps<ImageEventType>
  getSaveButtonProps: (options?: ButtonClickOptions) => ButtonProps
  getCancelButtonProps: (options?: ButtonClickOptions) => ButtonProps
  getRotateButtonProps: (degrees: number) => ButtonProps
  getFlipHorizontalButtonProps: () => ButtonProps
  getZoomButtonProps: (ratio: number) => ButtonProps
  getCropSquareButtonProps: () => ButtonProps
  getCropLandscapeButtonProps: () => ButtonProps
  getCropPortraitButtonProps: () => ButtonProps
  getResetButtonProps: () => ButtonProps
  getRotationSliderProps: () => SliderProps<SliderEventType>
}

export type ImageEditorStore<
  ImageEventType extends Event = Event,
  SliderEventType extends Event = Event,
> = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => ImageEditorSnapshot<ImageEventType, SliderEventType>
  start: () => void
  stop: () => void
}

const imgElementId = 'uppy-image-editor-image'

export function createImageEditorController<
  ImageEventType extends Event = Event,
  SliderEventType extends Event = Event,
>(
  uppy: Uppy<any, any>,
  options: { file: UppyFile<any, any> },
): ImageEditorStore<ImageEventType, SliderEventType> {
  const plugin = uppy.getPlugin<ImageEditor<any, any>>('ImageEditor')

  if (!plugin) {
    throw new Error(
      'ImageEditor plugin is not installed. Install @uppy/image-editor and add it to the Uppy instance with `uppy.use(ImageEditor)`.',
    )
  }

  // Get fresh file from Uppy state to ensure we have the latest data including blob
  const file = uppy.getFile(options.file.id) ?? options.file

  const subscribers = new Subscribers()

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
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

  const isCropperReady = () => plugin.getPluginState().cropperReady

  // Actions
  const save = (): void => {
    plugin.save()
  }

  const cancel = (): void => {
    uppy.emit('file-editor:cancel', file)
  }

  const rotateBy = (degrees: number): void => {
    plugin.rotateBy(degrees)
  }

  const rotateGranular = (degrees: number): void => {
    plugin.rotateGranular(degrees)
  }

  const flipHorizontal = (): void => {
    plugin.flipHorizontal()
  }

  const zoom = (ratio: number): void => {
    plugin.zoom(ratio)
  }

  const setAspectRatio = (newRatio: AspectRatio): void => {
    plugin.setAspectRatio(newRatio)
  }

  const reset = (): void => {
    plugin.reset()
  }

  // Props getters
  const getImageProps = (): ImageProps<ImageEventType> => ({
    id: imgElementId,
    src: plugin.getObjectUrl() ?? '',
    alt: file.name ?? '',
    onLoad: (e: ImageEventType) => {
      plugin.initCropper(e.currentTarget as HTMLImageElement)
    },
  })

  const getSaveButtonProps = (
    options: ButtonClickOptions = {},
  ): ButtonProps => ({
    type: 'button',
    onClick: () => {
      save()
      options.onClick?.()
    },
    disabled: !isCropperReady(),
    'aria-label': 'Save changes',
  })

  const getCancelButtonProps = (
    options: ButtonClickOptions = {},
  ): ButtonProps => ({
    type: 'button',
    onClick: () => {
      cancel()
      options.onClick?.()
    },
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

  const getRotationSliderProps = (): SliderProps<SliderEventType> => ({
    type: 'range',
    min: -45,
    max: 45,
    value: plugin.getPluginState().angleGranular,
    onChange: (e: SliderEventType) => {
      const granularAngle = Number((e.target as HTMLInputElement).value)
      rotateGranular(granularAngle)
    },
    'aria-label': 'Fine rotation adjustment',
  })

  const getSnapshot = (
    pluginState = plugin.getPluginState(),
  ): ImageEditorSnapshot<ImageEventType, SliderEventType> => ({
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
  let cachedSnapshot: ImageEditorSnapshot<ImageEventType, SliderEventType> =
    getSnapshot(cachedPluginState)

  const getCachedSnapshot = (): ImageEditorSnapshot<
    ImageEventType,
    SliderEventType
  > => {
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
