import type { Body, Meta, Uppy, UppyFile } from '@uppy/core'
import type ImageEditor from '@uppy/image-editor'
import {
  getCanvasDataThatFitsPerfectlyIntoContainer,
  getScaleFactorThatRemovesDarkCorners,
  limitCropboxMovementOnMove,
  limitCropboxMovementOnResize,
} from '@uppy/image-editor'
import type Cropper from 'cropperjs'
import { Subscribers } from './utils.js'

export type AspectRatio = 'free' | '1:1' | '16:9' | '9:16'

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
}

const imgElementId = 'uppy-image-editor-image'

export function createImageEditorController<M extends Meta, B extends Body>(
  uppy: Uppy<M, B>,
  options: { file: UppyFile<M, B> },
): ImageEditorStore {
  const plugin = uppy.getPlugin<ImageEditor<M, B>>('ImageEditor')

  if (!plugin) {
    throw new Error(
      'ImageEditor plugin is not installed. Install @uppy/image-editor and add it to the Uppy instance with `uppy.use(ImageEditor)`.',
    )
  }

  const { file } = options
  const subscribers = new Subscribers()

  // Internal state
  let angle = 0
  let isFlippedHorizontally = false
  let aspectRatio: AspectRatio = 'free'
  let prevCropboxData: Cropper.CropBoxData | null = null
  let objectUrl: string | null = null

  // Select file in plugin
  plugin.selectFile(file)

  // Create object URL for the image
  if (file.data && file.data instanceof Blob) {
    objectUrl = URL.createObjectURL(file.data)
  }

  // Cropper event handlers
  const storePrevCropboxData = (): void => {
    if (plugin.cropper) {
      prevCropboxData = plugin.cropper.getCropBoxData()
    }
  }

  const limitCropboxMovement = (event: {
    detail: { action: string }
  }): void => {
    if (!plugin.cropper || !prevCropboxData) return

    const canvasData = plugin.cropper.getCanvasData()
    const cropboxData = plugin.cropper.getCropBoxData()

    if (event.detail.action === 'all') {
      const newCropboxData = limitCropboxMovementOnMove(
        canvasData,
        cropboxData,
        prevCropboxData,
      )
      if (newCropboxData) plugin.cropper.setCropBoxData(newCropboxData)
    } else {
      const newCropboxData = limitCropboxMovementOnResize(
        canvasData,
        cropboxData,
        prevCropboxData,
      )
      if (newCropboxData) plugin.cropper.setCropBoxData(newCropboxData)
    }
  }

  // Lazy initialization of cropper - called when first action is triggered
  const ensureCropper = (): boolean => {
    // Already initialized
    if (plugin.cropper) return true

    const imgElement = document.getElementById(
      imgElementId,
    ) as HTMLImageElement | null
    if (!imgElement) return false

    // Dynamic import and initialize
    // Note: This is synchronous after first load since cropperjs will be cached
    const CropperClass = (window as any).Cropper
    if (!CropperClass) {
      // Fallback: try to import dynamically (this won't work synchronously)
      console.warn(
        'Cropper.js not found. Make sure to import cropperjs before using the image editor.',
      )
      return false
    }

    const cropper = new CropperClass(imgElement, plugin.opts.cropperOptions)
    plugin.storeCropperInstance(cropper)

    // Add event listeners
    imgElement.addEventListener('cropstart', storePrevCropboxData)
    // @ts-expect-error custom cropper event but DOM API does not understand
    imgElement.addEventListener('cropend', limitCropboxMovement)

    return true
  }

  // Cleanup function
  const cleanup = (): void => {
    if (plugin.cropper) {
      const imgElement = document.getElementById(
        imgElementId,
      ) as HTMLImageElement | null
      if (imgElement) {
        imgElement.removeEventListener('cropstart', storePrevCropboxData)
        // @ts-expect-error custom cropper event but DOM API does not understand
        imgElement.removeEventListener('cropend', limitCropboxMovement)
      }
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = null
    }
  }

  // Actions (internal, called by button props)
  const save = (): void => {
    if (!plugin.cropper) return
    plugin.save()
    cleanup()
  }

  const cancel = (): void => {
    uppy.emit('file-editor:cancel', file)
    plugin.setPluginState({ currentImage: null })
    cleanup()
  }

  const rotate = (degrees: number): void => {
    if (!ensureCropper() || !plugin.cropper) return

    angle = degrees

    // Reset scale before rotation
    plugin.cropper.scale(isFlippedHorizontally ? -1 : 1)
    plugin.cropper.rotateTo(degrees)

    // For 90-degree rotations, fit image into container
    if (degrees % 90 === 0) {
      const canvasData = plugin.cropper.getCanvasData()
      const containerData = plugin.cropper.getContainerData()
      const newCanvasData = getCanvasDataThatFitsPerfectlyIntoContainer(
        containerData,
        canvasData,
      )
      plugin.cropper.setCanvasData(newCanvasData)
      plugin.cropper.setCropBoxData(newCanvasData)
    } else {
      // For granular rotation, scale to remove dark corners
      const image = plugin.cropper.getImageData()
      const granularAngle = degrees % 90
      const scaleFactor = getScaleFactorThatRemovesDarkCorners(
        image.naturalWidth,
        image.naturalHeight,
        granularAngle,
      )
      const scaleFactorX = isFlippedHorizontally ? -scaleFactor : scaleFactor
      plugin.cropper.scale(scaleFactorX, scaleFactor)
    }

    subscribers.emit()
  }

  const flipHorizontal = (): void => {
    if (!ensureCropper() || !plugin.cropper) return

    isFlippedHorizontally = !isFlippedHorizontally
    plugin.cropper.scaleX(-plugin.cropper.getData().scaleX || -1)

    subscribers.emit()
  }

  const zoom = (ratio: number): void => {
    if (!ensureCropper() || !plugin.cropper) return
    plugin.cropper.zoom(ratio)
  }

  const setAspectRatio = (newRatio: AspectRatio): void => {
    if (!ensureCropper() || !plugin.cropper) return

    aspectRatio = newRatio
    const ratioMap: Record<AspectRatio, number> = {
      free: 0,
      '1:1': 1,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
    }
    plugin.cropper.setAspectRatio(ratioMap[newRatio])

    subscribers.emit()
  }

  const reset = (): void => {
    if (!ensureCropper() || !plugin.cropper) return

    plugin.cropper.reset()
    plugin.cropper.setAspectRatio(
      plugin.opts.cropperOptions.initialAspectRatio || 0,
    )
    angle = 0
    isFlippedHorizontally = false
    aspectRatio = 'free'

    subscribers.emit()
  }

  // Props getters
  const getImageProps = () => ({
    id: imgElementId,
    src: objectUrl ?? '',
    alt: file.name ?? '',
  })

  const isCropperReady = () => plugin.cropper !== null

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
    onClick: () => rotate(angle + degrees),
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
    value: angle % 90,
    onChange: (e: Event) => {
      const granularAngle = Number((e.target as HTMLInputElement).value)
      const base90 = Math.floor(angle / 90) * 90
      rotate(base90 + granularAngle)
    },
    'aria-label': 'Fine rotation adjustment',
  })

  const getSnapshot = (): ImageEditorSnapshot => ({
    state: {
      angle,
      isFlippedHorizontally,
      aspectRatio,
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

  // Cached snapshot for reference stability
  let cachedSnapshot = getSnapshot()

  const getCachedSnapshot = (): ImageEditorSnapshot => {
    const nextSnapshot = getSnapshot()

    // Compare state values for cache invalidation
    if (
      nextSnapshot.state.angle === cachedSnapshot.state.angle &&
      nextSnapshot.state.isFlippedHorizontally ===
        cachedSnapshot.state.isFlippedHorizontally &&
      nextSnapshot.state.aspectRatio === cachedSnapshot.state.aspectRatio
    ) {
      return cachedSnapshot
    }

    cachedSnapshot = nextSnapshot
    return cachedSnapshot
  }

  return {
    subscribe: subscribers.add,
    getSnapshot: getCachedSnapshot,
  }
}
