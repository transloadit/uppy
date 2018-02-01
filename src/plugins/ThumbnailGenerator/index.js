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
   * Resize an image to the target `width` and `height`.
   *
   * Returns a Canvas with the resized image on it.
   */
  resizeImage (image, targetWidth, targetHeight) {
    // let sourceWidth = image.width
    // let sourceHeight = image.height

    // if (targetHeight < image.height / 2) {
    //   const steps = Math.floor(
    //     Math.log(image.width / targetWidth) / Math.log(2)
    //   )
    //   const stepScaled = this.downScaleInSteps(image, steps)
    //   image = stepScaled.image
    //   sourceWidth = stepScaled.sourceWidth
    //   sourceHeight = stepScaled.sourceHeight
    // }

    var steps = Math.ceil(Math.log2(image.width / targetWidth))
    var sW = targetWidth * Math.pow(2, steps - 1)
    var sH = targetHeight * Math.pow(2, steps - 1)
    var x = 2

    while (steps--) {
      console.log(sW, sH)
      var canvas = document.createElement('canvas')
      canvas.width = sW
      canvas.height = sH
      canvas.getContext('2d').drawImage(image, 0, 0, sW, sH)
      image = canvas

      sW = Math.round(sW / x)
      sH = Math.round(sH / x)
    }

    return image

    // const canvas = document.createElement('canvas')
    // canvas.width = targetWidth
    // canvas.height = targetHeight

    // const context = canvas.getContext('2d')
    // context.drawImage(
    //   image,
    //   0,
    //   0,
    //   sourceWidth,
    //   sourceHeight,
    //   0,
    //   0,
    //   targetWidth,
    //   targetHeight
    // )
    // return canvas
  }

  /**
   * Downscale an image by 50% `steps` times.
   */
  downScaleInSteps (image, steps) {
    let source = image
    let currentWidth = source.width
    let currentHeight = source.height

    for (let i = 0; i < steps; i += 1) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = currentWidth / 2
      canvas.height = currentHeight / 2
      context.drawImage(
        source,
        // The entire source image. We pass width and height here,
        // because we reuse this canvas, and should only scale down
        // the part of the canvas that contains the previous scale step.
        0,
        0,
        currentWidth,
        currentHeight,
        // Draw to 50% size
        0,
        0,
        currentWidth / 2,
        currentHeight / 2
      )
      currentWidth /= 2
      currentHeight /= 2
      source = canvas
    }

    return {
      image: source,
      sourceWidth: currentWidth,
      sourceHeight: currentHeight
    }
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
    const { files } = this.uppy.state
    this.uppy.setState({
      files: Object.assign({}, files, {
        [fileID]: Object.assign({}, files[fileID], {
          preview: preview
        })
      })
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

  install () {
    this.uppy.on('file-added', this.addToQueue)
  }
  uninstall () {
    this.uppy.off('file-added', this.addToQueue)
  }
}
