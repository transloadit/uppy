const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const dataURItoBlob = require('@uppy/utils/lib/dataURItoBlob')
const isObjectURL = require('@uppy/utils/lib/isObjectURL')
const isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported')
const MathLog2 = require('math-log2') // Polyfill for IE.
const exifr = require('exifr/dist/mini.legacy.umd.js')

/**
 * The Thumbnail Generator plugin
 */

module.exports = class ThumbnailGenerator extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'modifier'
    this.id = this.opts.id || 'ThumbnailGenerator'
    this.title = 'Thumbnail Generator'
    this.queue = []
    this.queueProcessing = false
    this.defaultThumbnailDimension = 200
    this.thumbnailType = this.opts.thumbnailType || 'image/jpeg'

    this.defaultLocale = {
      strings: {
        generatingThumbnails: 'Generating thumbnails...'
      }
    }

    const defaultOptions = {
      thumbnailWidth: null,
      thumbnailHeight: null,
      waitForThumbnailsBeforeUpload: false,
      lazy: false
    }

    this.opts = { ...defaultOptions, ...opts }

    if (this.opts.lazy && this.opts.waitForThumbnailsBeforeUpload) {
      throw new Error('ThumbnailGenerator: The `lazy` and `waitForThumbnailsBeforeUpload` options are mutually exclusive. Please ensure at most one of them is set to `true`.')
    }

    this.i18nInit()
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
  }

  /**
   * Create a thumbnail for the given Uppy file object.
   *
   * @param {{data: Blob}} file
   * @param {number} targetWidth
   * @param {number} targetHeight
   * @returns {Promise}
   */
  createThumbnail (file, targetWidth, targetHeight) {
    // bug in the compatibility data
    // eslint-disable-next-line compat/compat
    const originalUrl = URL.createObjectURL(file.data)

    const onload = new Promise((resolve, reject) => {
      const image = new Image()
      image.src = originalUrl
      image.addEventListener('load', () => {
        // bug in the compatibility data
        // eslint-disable-next-line compat/compat
        URL.revokeObjectURL(originalUrl)
        resolve(image)
      })
      image.addEventListener('error', (event) => {
        // bug in the compatibility data
        // eslint-disable-next-line compat/compat
        URL.revokeObjectURL(originalUrl)
        reject(event.error || new Error('Could not create thumbnail'))
      })
    })

    const orientationPromise = exifr.rotation(file.data).catch(_err => 1)

    return Promise.all([onload, orientationPromise])
      .then(([image, orientation]) => {
        const dimensions = this.getProportionalDimensions(image, targetWidth, targetHeight, orientation.deg)
        const rotatedImage = this.rotateImage(image, orientation)
        const resizedImage = this.resizeImage(rotatedImage, dimensions.width, dimensions.height)
        return this.canvasToBlob(resizedImage, this.thumbnailType, 80)
      })
      .then(blob => {
        // bug in the compatibility data
        // eslint-disable-next-line compat/compat
        return URL.createObjectURL(blob)
      })
  }

  /**
   * Get the new calculated dimensions for the given image and a target width
   * or height. If both width and height are given, only width is taken into
   * account. If neither width nor height are given, the default dimension
   * is used.
   */
  getProportionalDimensions (img, width, height, rotation) {
    var aspect = img.width / img.height
    if (rotation === 90 || rotation === 270) {
      aspect = img.height / img.width
    }

    if (width != null) {
      return {
        width: width,
        height: Math.round(width / aspect)
      }
    }

    if (height != null) {
      return {
        width: Math.round(height * aspect),
        height: height
      }
    }

    return {
      width: this.defaultThumbnailDimension,
      height: Math.round(this.defaultThumbnailDimension / aspect)
    }
  }

  /**
   * Make sure the image doesn’t exceed browser/device canvas limits.
   * For ios with 256 RAM and ie
   */
  protect (image) {
    // https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element

    var ratio = image.width / image.height

    var maxSquare = 5000000 // ios max canvas square
    var maxSize = 4096 // ie max canvas dimensions

    var maxW = Math.floor(Math.sqrt(maxSquare * ratio))
    var maxH = Math.floor(maxSquare / Math.sqrt(maxSquare * ratio))
    if (maxW > maxSize) {
      maxW = maxSize
      maxH = Math.round(maxW / ratio)
    }
    if (maxH > maxSize) {
      maxH = maxSize
      maxW = Math.round(ratio * maxH)
    }
    if (image.width > maxW) {
      var canvas = document.createElement('canvas')
      canvas.width = maxW
      canvas.height = maxH
      canvas.getContext('2d').drawImage(image, 0, 0, maxW, maxH)
      image = canvas
    }

    return image
  }

  /**
   * Resize an image to the target `width` and `height`.
   *
   * Returns a Canvas with the resized image on it.
   */
  resizeImage (image, targetWidth, targetHeight) {
    // Resizing in steps refactored to use a solution from
    // https://blog.uploadcare.com/image-resize-in-browsers-is-broken-e38eed08df01

    image = this.protect(image)

    var steps = Math.ceil(MathLog2(image.width / targetWidth))
    if (steps < 1) {
      steps = 1
    }
    var sW = targetWidth * Math.pow(2, steps - 1)
    var sH = targetHeight * Math.pow(2, steps - 1)
    var x = 2

    while (steps--) {
      var canvas = document.createElement('canvas')
      canvas.width = sW
      canvas.height = sH
      canvas.getContext('2d').drawImage(image, 0, 0, sW, sH)
      image = canvas

      sW = Math.round(sW / x)
      sH = Math.round(sH / x)
    }

    return image
  }

  rotateImage (image, translate) {
    var w = image.width
    var h = image.height

    if (translate.deg === 90 || translate.deg === 270) {
      w = image.height
      h = image.width
    }

    var canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h

    var context = canvas.getContext('2d')
    context.translate(w / 2, h / 2)
    if (translate.canvas) {
      context.rotate(translate.rad)
      context.scale(translate.scaleX, translate.scaleY)
    }
    context.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height)

    return canvas
  }

  /**
   * Save a <canvas> element's content to a Blob object.
   *
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise}
   */
  canvasToBlob (canvas, type, quality) {
    try {
      canvas.getContext('2d').getImageData(0, 0, 1, 1)
    } catch (err) {
      if (err.code === 18) {
        return Promise.reject(new Error('cannot read image, probably an svg with external resources'))
      }
    }

    if (canvas.toBlob) {
      return new Promise(resolve => {
        canvas.toBlob(resolve, type, quality)
      }).then((blob) => {
        if (blob === null) {
          throw new Error('cannot read image, probably an svg with external resources')
        }
        return blob
      })
    }
    return Promise.resolve().then(() => {
      return dataURItoBlob(canvas.toDataURL(type, quality), {})
    }).then((blob) => {
      if (blob === null) {
        throw new Error('could not extract blob, probably an old browser')
      }
      return blob
    })
  }

  /**
   * Set the preview URL for a file.
   */
  setPreviewURL (fileID, preview) {
    this.uppy.setFileState(fileID, { preview })
  }

  addToQueue (item) {
    this.queue.push(item)
    if (this.queueProcessing === false) {
      this.processQueue()
    }
  }

  processQueue () {
    this.queueProcessing = true
    if (this.queue.length > 0) {
      const current = this.uppy.getFile(this.queue.shift())
      if (!current) {
        this.uppy.log('[ThumbnailGenerator] file was removed before a thumbnail could be generated, but not removed from the queue. This is probably a bug', 'error')
        return
      }
      return this.requestThumbnail(current)
        .catch(err => {}) // eslint-disable-line handle-callback-err
        .then(() => this.processQueue())
    } else {
      this.queueProcessing = false
      this.uppy.log('[ThumbnailGenerator] Emptied thumbnail queue')
      this.uppy.emit('thumbnail:all-generated')
    }
  }

  requestThumbnail (file) {
    if (isPreviewSupported(file.type) && !file.isRemote) {
      return this.createThumbnail(file, this.opts.thumbnailWidth, this.opts.thumbnailHeight)
        .then(preview => {
          this.setPreviewURL(file.id, preview)
          this.uppy.log(`[ThumbnailGenerator] Generated thumbnail for ${file.id}`)
          this.uppy.emit('thumbnail:generated', this.uppy.getFile(file.id), preview)
        })
        .catch(err => {
          this.uppy.log(`[ThumbnailGenerator] Failed thumbnail for ${file.id}:`, 'warning')
          this.uppy.log(err, 'warning')
          this.uppy.emit('thumbnail:error', this.uppy.getFile(file.id), err)
        })
    }
    return Promise.resolve()
  }

  onFileAdded = (file) => {
    if (!file.preview && isPreviewSupported(file.type) && !file.isRemote) {
      this.addToQueue(file.id)
    }
  }

  /**
   * Cancel a lazy request for a thumbnail if the thumbnail has not yet been generated.
   */
  onCancelRequest = (file) => {
    const index = this.queue.indexOf(file.id)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }
  }

  /**
   * Clean up the thumbnail for a file. Cancel lazy requests and free the thumbnail URL.
   */
  onFileRemoved = (file) => {
    const index = this.queue.indexOf(file.id)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }

    // Clean up object URLs.
    if (file.preview && isObjectURL(file.preview)) {
      URL.revokeObjectURL(file.preview)
    }
  }

  onRestored = () => {
    const { files } = this.uppy.getState()
    const fileIDs = Object.keys(files)
    fileIDs.forEach((fileID) => {
      const file = this.uppy.getFile(fileID)
      if (!file.isRestored) return
      // Only add blob URLs; they are likely invalid after being restored.
      if (!file.preview || isObjectURL(file.preview)) {
        this.addToQueue(file.id)
      }
    })
  }

  waitUntilAllProcessed = (fileIDs) => {
    fileIDs.forEach((fileID) => {
      const file = this.uppy.getFile(fileID)
      this.uppy.emit('preprocess-progress', file, {
        mode: 'indeterminate',
        message: this.i18n('generatingThumbnails')
      })
    })

    const emitPreprocessCompleteForAll = () => {
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID)
        this.uppy.emit('preprocess-complete', file)
      })
    }

    return new Promise((resolve, reject) => {
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

  install () {
    this.uppy.on('file-removed', this.onFileRemoved)
    if (this.opts.lazy) {
      this.uppy.on('thumbnail:request', this.onFileAdded)
      this.uppy.on('thumbnail:cancel', this.onCancelRequest)
    } else {
      this.uppy.on('file-added', this.onFileAdded)
      this.uppy.on('restored', this.onRestored)
    }

    if (this.opts.waitForThumbnailsBeforeUpload) {
      this.uppy.addPreProcessor(this.waitUntilAllProcessed)
    }
  }

  uninstall () {
    this.uppy.off('file-removed', this.onFileRemoved)
    if (this.opts.lazy) {
      this.uppy.off('thumbnail:request', this.onFileAdded)
      this.uppy.off('thumbnail:cancel', this.onCancelRequest)
    } else {
      this.uppy.off('file-added', this.onFileAdded)
      this.uppy.off('restored', this.onRestored)
    }

    if (this.opts.waitForThumbnailsBeforeUpload) {
      this.uppy.removePreProcessor(this.waitUntilAllProcessed)
    }
  }
}
