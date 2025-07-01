import type {
  Body,
  DefinePluginOpts,
  Meta,
  UIPluginOptions,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import type { LocaleStrings } from '@uppy/utils/lib/Translator'
import type Cropper from 'cropperjs'
import { h } from 'preact'
import packageJson from '../package.json' with { type: 'json' }
import Editor from './Editor.js'
import locale from './locale.js'

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
}

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

  cropper!: Cropper

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
    const saveBlobCallback: BlobCallback = (blob) => {
      const { currentImage } = this.getPluginState()

      this.uppy.setFileState(currentImage!.id, {
        // Reinserting image's name and type, because .toBlob loses both.
        data: new File([blob!], currentImage!.name ?? this.i18n('unnamed'), {
          type: blob!.type,
        }),
        size: blob!.size,
        preview: undefined,
      })

      const updatedFile = this.uppy.getFile(currentImage!.id)
      this.uppy.emit('thumbnail:request', updatedFile)
      this.setPluginState({
        currentImage: updatedFile,
      })
      this.uppy.emit('file-editor:complete', updatedFile)
    }

    const { currentImage } = this.getPluginState()

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
    this.uppy.emit('file-editor:start', file)
    this.setPluginState({
      currentImage: file,
    })
  }

  install(): void {
    this.setPluginState({
      currentImage: null,
    })

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
    this.unmount()
  }

  render() {
    const { currentImage } = this.getPluginState()

    if (currentImage === null || currentImage.isRemote) {
      return null
    }

    return (
      <Editor<M, B>
        currentImage={currentImage}
        storeCropperInstance={this.storeCropperInstance}
        save={this.save}
        opts={this.opts}
        i18n={this.i18n}
      />
    )
  }
}
