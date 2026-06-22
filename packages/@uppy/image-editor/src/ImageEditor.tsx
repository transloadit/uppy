import type {
  Body,
  DefinePluginOpts,
  Meta,
  UIPluginOptions,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import type { LocaleStrings } from '@uppy/utils'
import Cropper from 'cropperjs'
import packageJson from '../package.json' with { type: 'json' }
import Editor from './Editor.js'
import locale from './locale.js'
import getCanvasDataThatFitsPerfectlyIntoContainer from './utils/getCanvasDataThatFitsPerfectlyIntoContainer.js'
import getScaleFactorThatRemovesDarkCorners from './utils/getScaleFactorThatRemovesDarkCorners.js'
import limitCropboxMovementOnMove from './utils/limitCropboxMovementOnMove.js'
import limitCropboxMovementOnResize from './utils/limitCropboxMovementOnResize.js'

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    ImageEditor: ImageEditor<M, B>
  }
}

declare global {
  namespace preact {
    interface Component {
      // This is a workaround for https://github.com/preactjs/preact/issues/1206
      refs: Record<string, any>
    }
  }
}

type ThumbnailGeneratedCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B>,
  preview: string,
) => void
type GenericCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B>,
) => void
declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'thumbnail:request': GenericCallback<M, B>
    'thumbnail:generated': ThumbnailGeneratedCallback<M, B>
    'file-editor:complete': GenericCallback<M, B>
    'file-editor:start': GenericCallback<M, B>
    'file-editor:cancel': GenericCallback<M, B>
  }
}

export interface Opts extends UIPluginOptions {
  quality?: number
  cropperOptions?: Cropper.Options & {
    croppedCanvasOptions?: Cropper.GetCroppedCanvasOptions
  }
  actions?: {
    revert?: boolean
    rotate?: boolean
    granularRotate?: boolean
    flip?: boolean
    zoomIn?: boolean
    zoomOut?: boolean
    cropSquare?: boolean
    cropWidescreen?: boolean
    cropWidescreenVertical?: boolean
  }
  locale?: LocaleStrings<typeof locale>
}
export type { Opts as ImageEditorOptions }

type PluginState<M extends Meta, B extends Body> = {
  currentImage: UppyFile<M, B> | null
  angle: number
  angleGranular: number
  isFlippedHorizontally: boolean
  aspectRatio: AspectRatio
  cropperReady: boolean
}

export type AspectRatio = 'free' | '1:1' | '16:9' | '9:16'

const defaultEditorState = {
  angle: 0,
  angleGranular: 0,
  isFlippedHorizontally: false,
  aspectRatio: 'free',
  cropperReady: false,
} satisfies Omit<PluginState<any, any>, 'currentImage'>

const defaultCropperOptions = {
  viewMode: 0 as const,
  background: false,
  autoCropArea: 1,
  responsive: true,
  minCropBoxWidth: 70,
  minCropBoxHeight: 70,
  croppedCanvasOptions: {},
  initialAspectRatio: 0,
} satisfies Partial<Opts['cropperOptions']>

const defaultActions = {
  revert: true,
  rotate: true,
  granularRotate: true,
  flip: true,
  zoomIn: true,
  zoomOut: true,
  cropSquare: true,
  cropWidescreen: true,
  cropWidescreenVertical: true,
} satisfies Partial<Opts['actions']>

const defaultOptions = {
  // `quality: 1` increases the image size by orders of magnitude - 0.8 seems to be the sweet spot.
  // see https://github.com/fengyuanchen/cropperjs/issues/538#issuecomment-1776279427
  quality: 0.8,
  actions: defaultActions,
  cropperOptions: defaultCropperOptions,
} satisfies Partial<Opts>

type InternalImageEditorOpts = Omit<
  DefinePluginOpts<Opts, keyof typeof defaultOptions>,
  'actions' | 'cropperOptions'
> & {
  actions: DefinePluginOpts<
    NonNullable<Opts['actions']>,
    keyof typeof defaultActions
  >
  cropperOptions: DefinePluginOpts<
    NonNullable<Opts['cropperOptions']>,
    keyof typeof defaultCropperOptions
  >
}

export default class ImageEditor<
  M extends Meta,
  B extends Body,
> extends UIPlugin<InternalImageEditorOpts, M, B, PluginState<M, B>> {
  static VERSION = packageJson.version

  cropper: Cropper | null = null

  objectUrl: string | null = null

  prevCropboxData: Cropper.CropBoxData | null = null

  private imgElement: HTMLImageElement | null = null

  private cropstartHandler: (() => void) | null = null

  private cropendHandler: EventListener | null = null

  private cropperReadyHandler: (() => void) | null = null

  constructor(uppy: Uppy<M, B>, opts?: Opts) {
    super(uppy, {
      ...defaultOptions,
      ...opts,
      actions: {
        ...defaultActions,
        ...opts?.actions,
      },
      cropperOptions: {
        ...defaultCropperOptions,
        ...opts?.cropperOptions,
      },
    })
    this.id = this.opts.id || 'ImageEditor'
    this.title = 'Image Editor'
    this.type = 'editor'

    this.defaultLocale = locale

    this.i18nInit()
  }

  canEditFile(file: UppyFile<M, B>): boolean {
    if (!file.type || file.isRemote) {
      return false
    }

    const fileTypeSpecific = file.type.split('/')[1]

    if (/^(jpe?g|gif|png|bmp|webp)$/.test(fileTypeSpecific)) {
      return true
    }

    return false
  }

  save = (): void => {
    const { currentImage } = this.getPluginState()
    if (!currentImage) return
    if (!this.cropper) return

    const saveBlobCallback: BlobCallback = (blob) => {
      if (!blob) return
      const fileId = currentImage.id

      if (!this.uppy.getFile(fileId)) return

      this.uppy.setFileState(fileId, {
        // Reinserting image's name and type, because .toBlob loses both.
        data: new File([blob], currentImage.name ?? this.i18n('unnamed'), {
          type: blob.type,
        }),
        size: blob.size,
        preview: undefined,
      })

      const updatedFile = this.uppy.getFile(fileId)
      if (!updatedFile) return
      this.uppy.emit('thumbnail:request', updatedFile)
      this.setPluginState({
        currentImage: updatedFile,
      })
      this.uppy.emit('file-editor:complete', updatedFile)
    }

    // Fixes black 1px lines on odd-width images.
    // This should be removed when cropperjs fixes this issue.
    // (See https://github.com/transloadit/uppy/issues/4305 and https://github.com/fengyuanchen/cropperjs/issues/551).
    const croppedCanvas = this.cropper.getCroppedCanvas({})
    if (croppedCanvas.width % 2 !== 0) {
      this.cropper.setData({ width: croppedCanvas.width - 1 })
    }
    if (croppedCanvas.height % 2 !== 0) {
      this.cropper.setData({ height: croppedCanvas.height - 1 })
    }

    this.cropper
      .getCroppedCanvas(this.opts.cropperOptions.croppedCanvasOptions)
      .toBlob(saveBlobCallback, currentImage!.type, this.opts.quality)
  }

  storeCropperInstance = (cropper: Cropper): void => {
    this.cropper = cropper
  }

  selectFile = (file: UppyFile<M, B>): void => {
    this.start(file)
  }

  resetEditorState = (
    currentImage: UppyFile<M, B> | null = this.getPluginState().currentImage,
  ): void => {
    this.setPluginState({
      currentImage,
      ...defaultEditorState,
      // Preserve cropperReady if cropper instance exists
      cropperReady: !!this.cropper,
    })
  }

  rotateBy = (degrees: number): void => {
    if (!this.cropper) return

    const { angle, angleGranular, isFlippedHorizontally } =
      this.getPluginState()
    const base90 = angle - angleGranular
    const newAngle = base90 + degrees

    this.cropper.scale(isFlippedHorizontally ? -1 : 1)
    this.cropper.rotateTo(newAngle)

    const canvasData = this.cropper.getCanvasData()
    const containerData = this.cropper.getContainerData()
    const newCanvasData = getCanvasDataThatFitsPerfectlyIntoContainer(
      containerData,
      canvasData,
    )
    this.cropper.setCanvasData(newCanvasData)
    this.cropper.setCropBoxData(newCanvasData)

    this.setPluginState({
      angle: newAngle,
      angleGranular: 0,
    })
  }

  rotateGranular = (granularAngle: number): void => {
    if (!this.cropper) return

    const { angle, angleGranular, isFlippedHorizontally } =
      this.getPluginState()
    const base90 = angle - angleGranular
    const newAngle = base90 + granularAngle

    this.cropper.rotateTo(newAngle)

    const image = this.cropper.getImageData()
    const scaleFactor = getScaleFactorThatRemovesDarkCorners(
      image.naturalWidth,
      image.naturalHeight,
      granularAngle,
    )
    const scaleFactorX = isFlippedHorizontally ? -scaleFactor : scaleFactor
    this.cropper.scale(scaleFactorX, scaleFactor)

    this.setPluginState({
      angle: newAngle,
      angleGranular: granularAngle,
    })
  }

  flipHorizontal = (): void => {
    if (!this.cropper) return

    const { isFlippedHorizontally } = this.getPluginState()
    this.cropper.scaleX(-this.cropper.getData().scaleX || -1)
    this.setPluginState({
      isFlippedHorizontally: !isFlippedHorizontally,
    })
  }

  zoom = (ratio: number): void => {
    if (!this.cropper) return
    this.cropper.zoom(ratio)
  }

  setAspectRatio = (newRatio: AspectRatio): void => {
    if (!this.cropper) return

    const ratioMap: Record<AspectRatio, number> = {
      free: 0,
      '1:1': 1,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
    }
    this.cropper.setAspectRatio(ratioMap[newRatio])
    this.setPluginState({
      aspectRatio: newRatio,
    })
  }

  reset = (): void => {
    if (!this.cropper) return

    this.cropper.reset()
    this.cropper.setAspectRatio(
      this.opts.cropperOptions.initialAspectRatio || 0,
    )
    this.resetEditorState()
  }

  /**
   * Start editing a file - creates object URL and prepares state.
   * Called by hook's start() or when user opens editor.
   */
  start = (file: UppyFile<M, B>): void => {
    // Clean up any previous editing session
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }

    // Get file data - first try the passed file, then try fetching from Uppy state
    let fileData = file.data
    if (!(fileData instanceof Blob)) {
      const uppyFile = this.uppy.getFile(file.id)
      fileData = uppyFile?.data
    }

    if (fileData instanceof Blob) {
      this.objectUrl = URL.createObjectURL(fileData)
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '[Uppy ImageEditor] Cannot edit file: file.data is not a Blob.',
        'File:',
        file,
        'file.data:',
        file.data,
        'typeof file.data:',
        typeof file.data,
      )
    }

    this.uppy.emit('file-editor:start', file)
    this.resetEditorState(file)
  }

  /**
   * Stop editing - destroys cropper, revokes object URL, cleans up listeners.
   */
  stop = (): void => {
    this.destroyCropper()

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }

    this.resetEditorState(null)
  }

  /**
   * Initialize cropper on the image element. Called lazily when first edit action is triggered.
   * For headless use, the hook provides the image element.
   */
  initCropper = (imgElement: HTMLImageElement): void => {
    if (this.cropper) return // Already initialized

    this.imgElement = imgElement
    this.cropper = new Cropper(imgElement, this.opts.cropperOptions)

    // Store handlers so we can remove them later
    this.cropstartHandler = () => {
      if (this.cropper) {
        this.prevCropboxData = this.cropper.getCropBoxData()
      }
    }

    this.cropendHandler = ((event: CustomEvent<{ action: string }>) => {
      if (!this.cropper || !this.prevCropboxData) return

      const canvasData = this.cropper.getCanvasData()
      const cropboxData = this.cropper.getCropBoxData()

      if (event.detail.action === 'all') {
        const newCropboxData = limitCropboxMovementOnMove(
          canvasData,
          cropboxData,
          this.prevCropboxData,
        )
        if (newCropboxData) this.cropper.setCropBoxData(newCropboxData)
      } else {
        const newCropboxData = limitCropboxMovementOnResize(
          canvasData,
          cropboxData,
          this.prevCropboxData,
        )
        if (newCropboxData) this.cropper.setCropBoxData(newCropboxData)
      }
    }) as EventListener

    this.cropperReadyHandler = () => {
      this.setPluginState({ cropperReady: true })
    }

    imgElement.addEventListener('cropstart', this.cropstartHandler)
    imgElement.addEventListener('cropend', this.cropendHandler)
    imgElement.addEventListener('ready', this.cropperReadyHandler, {
      once: true,
    })
  }

  /**
   * Destroy cropper and clean up event listeners.
   */
  destroyCropper = (): void => {
    if (!this.cropper) return

    this.setPluginState({ cropperReady: false })

    if (this.cropstartHandler && this.imgElement) {
      this.imgElement.removeEventListener('cropstart', this.cropstartHandler)
    }
    if (this.cropendHandler && this.imgElement) {
      this.imgElement.removeEventListener('cropend', this.cropendHandler)
    }
    if (this.cropperReadyHandler && this.imgElement) {
      this.imgElement.removeEventListener('ready', this.cropperReadyHandler)
    }

    this.cropper.destroy()
    this.cropper = null
    this.imgElement = null
    this.cropstartHandler = null
    this.cropendHandler = null
    this.cropperReadyHandler = null
    this.prevCropboxData = null
  }

  /**
   * Get object URL for the current image (used by headless hook).
   */
  getObjectUrl = (): string | null => {
    return this.objectUrl
  }

  install(): void {
    this.resetEditorState(null)

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    const { currentImage } = this.getPluginState()

    if (currentImage) {
      const file = this.uppy.getFile(currentImage.id)
      this.uppy.emit('file-editor:cancel', file)
    }
    this.stop()
    this.unmount()
  }

  render() {
    const { currentImage, angleGranular } = this.getPluginState()

    if (currentImage === null || currentImage.isRemote) {
      return null
    }

    return (
      <Editor<M, B>
        currentImage={currentImage}
        objectUrl={this.objectUrl ?? ''}
        initCropper={this.initCropper}
        save={this.save}
        opts={this.opts}
        i18n={this.i18n}
        angleGranular={angleGranular}
        rotateBy={this.rotateBy}
        rotateGranular={this.rotateGranular}
        flipHorizontal={this.flipHorizontal}
        zoom={this.zoom}
        setAspectRatio={this.setAspectRatio}
        reset={this.reset}
      />
    )
  }
}
