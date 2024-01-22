import { UIPlugin, type Uppy } from '@uppy/core'
import type Cropper from 'cropperjs'
import { h } from 'preact'

import type { Meta, Body, UppyFile } from '@uppy/utils/lib/UppyFile'
import Editor from './Editor.tsx' // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.ts'

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

export type Opts = {
  id?: string
  target?: string | HTMLElement
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
}

type PluginState<M extends Meta, B extends Body> = {
  currentImage: UppyFile<M, B> | null
}

export default class ImageEditor<
  M extends Meta,
  B extends Body,
> extends UIPlugin<Opts, M, B, PluginState<M, B>> {
  static VERSION = packageJson.version

  cropper: Cropper

  opts: Required<Opts>

  constructor(uppy: Uppy<M, B>, opts: Opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ImageEditor'
    this.title = 'Image Editor'
    this.type = 'editor'

    this.defaultLocale = locale

    const defaultCropperOptions = {
      viewMode: 0,
      background: false,
      autoCropArea: 1,
      responsive: true,
      minCropBoxWidth: 70,
      minCropBoxHeight: 70,
      croppedCanvasOptions: {},
      initialAspectRatio: 0,
    }

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
    }

    // Why is the default quality smaller than 1?
    // Because `quality: 1` increases the image size by orders of magnitude - 0.8 seems to be the sweet spot.
    // (see https://github.com/fengyuanchen/cropperjs/issues/538#issuecomment-1776279427)
    const defaultOptions = {
      quality: 0.8,
    }

    this.opts = {
      ...defaultOptions,
      ...(opts as Required<Opts>),
      actions: {
        ...defaultActions,
        ...opts?.actions,
      },
      cropperOptions: {
        ...defaultCropperOptions,
        ...opts?.cropperOptions,
      } as Cropper.Options,
    }

    this.i18nInit()
  }

  // eslint-disable-next-line class-methods-use-this
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
        data: blob!,
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

  render(): JSX.Element | null {
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
