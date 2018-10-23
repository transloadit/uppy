const { Plugin } = require('@uppy/core')
const dataURItoBlob = require('@uppy/utils/lib/dataURItoBlob')
const isObjectURL = require('@uppy/utils/lib/isObjectURL')
const isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported')

/**
 * The Thumbnail Generator plugin
 */

module.exports = class ThumbnailGenerator extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'thumbnail'
    this.id = this.opts.id || 'ThumbnailGenerator'
    this.title = 'Thumbnail Generator'
    this.queue = []
    this.queueProcessing = false

    const defaultOptions = {
      thumbnailWidth: 200
    }

    this.opts = {
      ...defaultOptions,
      ...opts
    }

    this.onFileAdded = this.onFileAdded.bind(this)
    this.onFileRemoved = this.onFileRemoved.bind(this)
    this.onRestored = this.onRestored.bind(this)
  }

  /**
   * Create a thumbnail for the given Uppy file object.
   *
   * @param {{data: Blob}} file
   * @param {number} width
   * @return {Promise}
   */
  createThumbnail (file, targetWidth) {
    const originalUrl = URL.createObjectURL(file.data)

    const onload = new Promise((resolve, reject) => {
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

    return onload
      .then(image => {
        const targetHeight = this.getProportionalHeight(image, targetWidth)
        const canvas = this.resizeImage(image, targetWidth, targetHeight)
        return this.canvasToBlob(canvas, 'image/png')
      })
      .then(blob => {
        return URL.createObjectURL(blob)
      })
  }

  /**
   * Make sure the image doesn’t exceed browser/device canvas limits.
   * For ios with 256 RAM and ie
   */
  protect (image) {
    // https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element

    var ratio = image.width / image.height

    var maxSquare = 5000000  // ios max canvas square
    var maxSize = 4096  // ie max canvas dimensions

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

    // Use the Polyfill for Math.log2() since IE doesn't support log2
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2#Polyfill
    var steps = Math.ceil(Math.log(image.width / targetWidth) * Math.LOG2E)
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

  /**
   * Save a <canvas> element's content to a Blob object.
   *
   * @param {HTMLCanvasElement} canvas
   * @return {Promise}
   */
  canvasToBlob (canvas, type, quality) {
    if (canvas.toBlob) {
      return new Promise(resolve => {
        canvas.toBlob(resolve, type, quality)
      })
    }
    return Promise.resolve().then(() => {
      return dataURItoBlob(canvas.toDataURL(type, quality), {})
    })
  }

  getProportionalHeight (img, width) {
    const aspect = img.width / img.height
    return Math.round(width / aspect)
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
      const current = this.queue.shift()
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
      return this.createThumbnail(file, this.opts.thumbnailWidth)
        .then(preview => {
          this.setPreviewURL(file.id, preview)
          this.uppy.log(`[ThumbnailGenerator] Generated thumbnail for ${file.id}`)
          this.uppy.emit('thumbnail:generated', this.uppy.getFile(file.id), preview)
        })
        .catch(err => {
          this.uppy.log(`[ThumbnailGenerator] Failed thumbnail for ${file.id}`)
          this.uppy.log(err, 'warning')
          this.uppy.emit('thumbnail:error', this.uppy.getFile(file.id), err)
        })
    }
    return Promise.resolve()
  }

  onFileAdded (file) {
    if (!file.preview) {
      this.addToQueue(file)
    }
  }

  onFileRemoved (file) {
    const index = this.queue.indexOf(file)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }

    // Clean up object URLs.
    if (file.preview && isObjectURL(file.preview)) {
      URL.revokeObjectURL(file.preview)
    }
  }

  onRestored () {
    const { files } = this.uppy.getState()
    const fileIDs = Object.keys(files)
    fileIDs.forEach((fileID) => {
      const file = this.uppy.getFile(fileID)
      if (!file.isRestored) return
      // Only add blob URLs; they are likely invalid after being restored.
      if (!file.preview || isObjectURL(file.preview)) {
        this.addToQueue(file)
      }
    })
  }

  install () {
    this.uppy.on('file-added', this.onFileAdded)
    this.uppy.on('file-removed', this.onFileRemoved)
    this.uppy.on('restored', this.onRestored)
  }
  uninstall () {
    this.uppy.off('file-added', this.onFileAdded)
    this.uppy.off('file-removed', this.onFileRemoved)
    this.uppy.off('restored', this.onRestored)
  }
}
