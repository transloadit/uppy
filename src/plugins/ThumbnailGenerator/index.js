const Plugin = require('../../core/Plugin')
const Utils = require('../../core/Utils')
/**
 * The Thumbnail Generator plugin
 *
 */

module.exports = class ThumbnailGenerator extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'thumbnail'
    this.id = 'ThumbnailGenerator'
    this.title = 'Thumbnail Generator'
    this.queue = []
    this.queueProcessing = false

    const defaultOptions = {
      thumbnailWidth: 200
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.addToQueue = this.addToQueue.bind(this)
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
      image.onload = () => {
        URL.revokeObjectURL(originalUrl)
        resolve(image)
      }
      image.onerror = () => {
        // The onerror event is totally useless unfortunately, as far as I know
        URL.revokeObjectURL(originalUrl)
        reject(new Error('Could not create thumbnail'))
      }
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
      image.src = 'about:blank'
      image.width = 1
      image.height = 1
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
      return Utils.dataURItoBlob(canvas.toDataURL(type, quality), {})
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
    this.uppy.setFileState(fileID, {
      preview: preview
    })
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
    }
  }

  requestThumbnail (file) {
    if (Utils.isPreviewSupported(file.type) && !file.isRemote) {
      return this.createThumbnail(file, this.opts.thumbnailWidth)
        .then(preview => {
          this.setPreviewURL(file.id, preview)
        })
        .catch(err => {
          console.warn(err.stack || err.message)
        })
    }
    return Promise.resolve()
  }

  onRestored () {
    const fileIDs = Object.keys(this.uppy.getState().files)
    fileIDs.forEach((fileID) => {
      const file = this.uppy.getFile(fileID)
      if (!file.isRestored) return
      // Only add blob URLs; they are likely invalid after being restored.
      if (!file.preview || /^blob:/.test(file.preview)) {
        this.addToQueue(file)
      }
    })
  }

  install () {
    this.uppy.on('file-added', this.addToQueue)
    this.uppy.on('restored', this.onRestored)
  }
  uninstall () {
    this.uppy.off('file-added', this.addToQueue)
    this.uppy.off('restored', this.onRestored)
  }
}
