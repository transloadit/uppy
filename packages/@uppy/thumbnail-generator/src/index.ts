import type { DefinePluginOpts, UIPluginOptions, Uppy } from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import dataURItoBlob from '@uppy/utils/lib/dataURItoBlob'
import isObjectURL from '@uppy/utils/lib/isObjectURL'
import isPreviewSupported from '@uppy/utils/lib/isPreviewSupported'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
// @ts-ignore untyped
import { rotation } from 'exifr/dist/mini.esm.mjs'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'thumbnail:all-generated': () => void
    'thumbnail:generated': (file: UppyFile<M, B>, preview: string) => void
    'thumbnail:error': (file: UppyFile<M, B>, error: Error) => void
    'thumbnail:request': (file: UppyFile<M, B>) => void
    'thumbnail:cancel': (file: UppyFile<M, B>) => void
  }
}

interface Rotation {
  deg: number
  rad: number
  scaleX: number
  scaleY: number
  dimensionSwapped: boolean
  css: boolean
  canvas: boolean
}

/**
 * Save a <canvas> element's content to a Blob object.
 *
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | File> {
  try {
    canvas.getContext('2d')!.getImageData(0, 0, 1, 1)
  } catch (err) {
    if (err.code === 18) {
      return Promise.reject(
        new Error('cannot read image, probably an svg with external resources'),
      )
    }
  }

  if (canvas.toBlob) {
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, type, quality)
    }).then((blob) => {
      if (blob === null) {
        throw new Error(
          'cannot read image, probably an svg with external resources',
        )
      }
      return blob
    })
  }
  return Promise.resolve()
    .then(() => {
      return dataURItoBlob(canvas.toDataURL(type, quality), {})
    })
    .then((blob) => {
      if (blob === null) {
        throw new Error('could not extract blob, probably an old browser')
      }
      return blob
    })
}

function rotateImage(image: HTMLImageElement, translate: Rotation) {
  let w = image.width
  let h = image.height

  if (translate.deg === 90 || translate.deg === 270) {
    w = image.height
    h = image.width
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h

  const context = canvas.getContext('2d')!
  context.translate(w / 2, h / 2)
  if (translate.canvas) {
    context.rotate(translate.rad)
    context.scale(translate.scaleX, translate.scaleY)
  }
  context.drawImage(
    image,
    -image.width / 2,
    -image.height / 2,
    image.width,
    image.height,
  )

  return canvas
}

/**
 * Make sure the image doesn’t exceed browser/device canvas limits.
 * For ios with 256 RAM and ie
 */
function protect(image: HTMLCanvasElement): HTMLCanvasElement {
  // https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element

  const ratio = image.width / image.height

  const maxSquare = 5000000 // ios max canvas square
  const maxSize = 4096 // ie max canvas dimensions

  let maxW = Math.floor(Math.sqrt(maxSquare * ratio))
  let maxH = Math.floor(maxSquare / Math.sqrt(maxSquare * ratio))
  if (maxW > maxSize) {
    maxW = maxSize
    maxH = Math.round(maxW / ratio)
  }
  if (maxH > maxSize) {
    maxH = maxSize
    maxW = Math.round(ratio * maxH)
  }
  if (image.width > maxW) {
    const canvas = document.createElement('canvas')
    canvas.width = maxW
    canvas.height = maxH
    canvas.getContext('2d')!.drawImage(image, 0, 0, maxW, maxH)
    return canvas
  }

  return image
}

export interface ThumbnailGeneratorOptions extends UIPluginOptions {
  thumbnailWidth?: number | null
  thumbnailHeight?: number | null
  thumbnailType?: string
  waitForThumbnailsBeforeUpload?: boolean
  lazy?: boolean
}

const defaultOptions = {
  thumbnailWidth: null,
  thumbnailHeight: null,
  thumbnailType: 'image/jpeg',
  waitForThumbnailsBeforeUpload: false,
  lazy: false,
}

type Opts = DefinePluginOpts<
  ThumbnailGeneratorOptions,
  keyof typeof defaultOptions
>

/**
 * The Thumbnail Generator plugin
 */

export default class ThumbnailGenerator<
  M extends Meta,
  B extends Body,
> extends UIPlugin<Opts, M, B> {
  static VERSION = packageJson.version

  queue: string[]

  queueProcessing: boolean

  defaultThumbnailDimension: number

  thumbnailType: string

  constructor(uppy: Uppy<M, B>, opts?: ThumbnailGeneratorOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'modifier'
    this.id = this.opts.id || 'ThumbnailGenerator'
    this.title = 'Thumbnail Generator'
    this.queue = []
    this.queueProcessing = false
    this.defaultThumbnailDimension = 200
    this.thumbnailType = this.opts.thumbnailType

    this.defaultLocale = locale

    this.i18nInit()

    if (this.opts.lazy && this.opts.waitForThumbnailsBeforeUpload) {
      throw new Error(
        'ThumbnailGenerator: The `lazy` and `waitForThumbnailsBeforeUpload` options are mutually exclusive. Please ensure at most one of them is set to `true`.',
      )
    }
  }

  createThumbnail(
    file: UppyFile<M, B>,
    targetWidth: number | null,
    targetHeight: number | null,
  ): Promise<string> {
    const originalUrl = URL.createObjectURL(file.data)

    const onload = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.src = originalUrl
      image.addEventListener('load', () => {
        URL.revokeObjectURL(originalUrl)
        resolve(image)
      })
      image.addEventListener('error', (event) => {
        URL.revokeObjectURL(originalUrl)
        reject(event.error || new Error('Could not create thumbnail'))
      })
    })

    const orientationPromise = rotation(file.data).catch(
      () => 1,
    ) as Promise<Rotation>

    return Promise.all([onload, orientationPromise])
      .then(([image, orientation]) => {
        const dimensions = this.getProportionalDimensions(
          image,
          targetWidth,
          targetHeight,
          orientation.deg,
        )
        const rotatedImage = rotateImage(image, orientation)
        const resizedImage = this.resizeImage(
          rotatedImage,
          dimensions.width,
          dimensions.height,
        )
        return canvasToBlob(resizedImage, this.thumbnailType, 80)
      })
      .then((blob) => {
        return URL.createObjectURL(blob)
      })
  }

  /**
   * Get the new calculated dimensions for the given image and a target width
   * or height. If both width and height are given, only width is taken into
   * account. If neither width nor height are given, the default dimension
   * is used.
   */
  getProportionalDimensions(
    img: HTMLImageElement,
    width: number | null,
    height: number | null,
    deg: number,
  ): { width: number; height: number } {
    let aspect = img.width / img.height
    if (deg === 90 || deg === 270) {
      aspect = img.height / img.width
    }

    if (width != null) {
      return {
        width,
        height: Math.round(width / aspect),
      }
    }

    if (height != null) {
      return {
        width: Math.round(height * aspect),
        height,
      }
    }

    return {
      width: this.defaultThumbnailDimension,
      height: Math.round(this.defaultThumbnailDimension / aspect),
    }
  }

  /**
   * Resize an image to the target `width` and `height`.
   *
   * Returns a Canvas with the resized image on it.
   */
  resizeImage(
    image: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
  ): HTMLCanvasElement {
    // Resizing in steps refactored to use a solution from
    // https://blog.uploadcare.com/image-resize-in-browsers-is-broken-e38eed08df01

    let img = protect(image)

    let steps = Math.ceil(Math.log2(img.width / targetWidth))
    if (steps < 1) {
      steps = 1
    }
    let sW = targetWidth * 2 ** (steps - 1)
    let sH = targetHeight * 2 ** (steps - 1)
    const x = 2

    while (steps--) {
      const canvas = document.createElement('canvas')
      canvas.width = sW
      canvas.height = sH
      canvas.getContext('2d')!.drawImage(img, 0, 0, sW, sH)
      img = canvas

      sW = Math.round(sW / x)
      sH = Math.round(sH / x)
    }

    return img
  }

  /**
   * Set the preview URL for a file.
   */
  setPreviewURL(fileID: string, preview: string): void {
    this.uppy.setFileState(fileID, { preview })
  }

  addToQueue(fileID: string): void {
    this.queue.push(fileID)
    if (this.queueProcessing === false) {
      this.processQueue()
    }
  }

  processQueue(): Promise<void> {
    this.queueProcessing = true
    if (this.queue.length > 0) {
      const current = this.uppy.getFile(this.queue.shift() as string)
      if (!current) {
        this.uppy.log(
          '[ThumbnailGenerator] file was removed before a thumbnail could be generated, but not removed from the queue. This is probably a bug',
          'error',
        )
        return Promise.resolve()
      }
      return this.requestThumbnail(current)
        .catch(() => {})
        .then(() => this.processQueue())
    }
    this.queueProcessing = false
    this.uppy.log('[ThumbnailGenerator] Emptied thumbnail queue')
    this.uppy.emit('thumbnail:all-generated')
    return Promise.resolve()
  }

  requestThumbnail(file: UppyFile<M, B>): Promise<void> {
    if (isPreviewSupported(file.type) && !file.isRemote) {
      return this.createThumbnail(
        file,
        this.opts.thumbnailWidth,
        this.opts.thumbnailHeight,
      )
        .then((preview) => {
          this.setPreviewURL(file.id, preview)
          this.uppy.log(
            `[ThumbnailGenerator] Generated thumbnail for ${file.id}`,
          )
          this.uppy.emit(
            'thumbnail:generated',
            this.uppy.getFile(file.id),
            preview,
          )
        })
        .catch((err) => {
          this.uppy.log(
            `[ThumbnailGenerator] Failed thumbnail for ${file.id}:`,
            'warning',
          )
          this.uppy.log(err, 'warning')
          this.uppy.emit('thumbnail:error', this.uppy.getFile(file.id), err)
        })
    }
    return Promise.resolve()
  }

  onFileAdded = (file: UppyFile<M, B>): void => {
    if (
      !file.preview &&
      file.data &&
      isPreviewSupported(file.type) &&
      !file.isRemote
    ) {
      this.addToQueue(file.id)
    }
  }

  /**
   * Cancel a lazy request for a thumbnail if the thumbnail has not yet been generated.
   */
  onCancelRequest = (file: UppyFile<M, B>): void => {
    const index = this.queue.indexOf(file.id)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }
  }

  /**
   * Clean up the thumbnail for a file. Cancel lazy requests and free the thumbnail URL.
   */
  onFileRemoved = (file: UppyFile<M, B>): void => {
    const index = this.queue.indexOf(file.id)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }

    // Clean up object URLs.
    if (file.preview && isObjectURL(file.preview)) {
      URL.revokeObjectURL(file.preview)
    }
  }

  onRestored = (): void => {
    const restoredFiles = this.uppy.getFiles().filter((file) => file.isRestored)
    restoredFiles.forEach((file) => {
      // Only add blob URLs; they are likely invalid after being restored.
      if (!file.preview || isObjectURL(file.preview)) {
        this.addToQueue(file.id)
      }
    })
  }

  onAllFilesRemoved = (): void => {
    this.queue = []
  }

  waitUntilAllProcessed = (fileIDs: string[]): Promise<void> => {
    fileIDs.forEach((fileID) => {
      const file = this.uppy.getFile(fileID)
      this.uppy.emit('preprocess-progress', file, {
        mode: 'indeterminate',
        message: this.i18n('generatingThumbnails'),
      })
    })

    const emitPreprocessCompleteForAll = () => {
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID)
        this.uppy.emit('preprocess-complete', file)
      })
    }

    return new Promise((resolve) => {
      if (this.queueProcessing) {
        this.uppy.once('thumbnail:all-generated', () => {
          emitPreprocessCompleteForAll()
          resolve()
        })
      } else {
        emitPreprocessCompleteForAll()
        resolve()
      }
    })
  }

  install(): void {
    this.uppy.on('file-removed', this.onFileRemoved)
    this.uppy.on('cancel-all', this.onAllFilesRemoved)

    if (this.opts.lazy) {
      this.uppy.on('thumbnail:request', this.onFileAdded)
      this.uppy.on('thumbnail:cancel', this.onCancelRequest)
    } else {
      this.uppy.on('thumbnail:request', this.onFileAdded)
      this.uppy.on('file-added', this.onFileAdded)
      this.uppy.on('restored', this.onRestored)
    }

    if (this.opts.waitForThumbnailsBeforeUpload) {
      this.uppy.addPreProcessor(this.waitUntilAllProcessed)
    }
  }

  uninstall(): void {
    this.uppy.off('file-removed', this.onFileRemoved)
    this.uppy.off('cancel-all', this.onAllFilesRemoved)

    if (this.opts.lazy) {
      this.uppy.off('thumbnail:request', this.onFileAdded)
      this.uppy.off('thumbnail:cancel', this.onCancelRequest)
    } else {
      this.uppy.off('thumbnail:request', this.onFileAdded)
      this.uppy.off('file-added', this.onFileAdded)
      this.uppy.off('restored', this.onRestored)
    }

    if (this.opts.waitForThumbnailsBeforeUpload) {
      this.uppy.removePreProcessor(this.waitUntilAllProcessed)
    }
  }
}
