const bytes = require('prettier-bytes')
const defaultOptions = require('./default')
const Utils = require('../../core/Utils')
const Plugin = require('../../core/Plugin')

module.exports = class ImageCompressor extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'modifiers'
    this.id = 'ImageCompressor'
    this.title = 'Image Compressor'
    this.queue = []
    this.queueProcessing = false
    this.diff = {
      origin: '{origin_size}',
      compressed: '{compressed_size}',
      percent: '{percent}',
      message: '{file_name} is {percent} compressed from size {origin_size} to {compressed_size}'
    }

    this.opts = Object.assign({}, defaultOptions, opts)
    this.addToQueue = this.addToQueue.bind(this)
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
      return this.requestCompressFile(current)
        .catch(err => {}) // eslint-disable-line handle-callback-err
        .then(() => this.processQueue())
    } else {
      this.queueProcessing = false
    }
  }

  requestCompressFile (file) {
    if (Utils.isPreviewSupported(file.type) && !file.isRemote) {
      return this.compressFile(file)
        .then(compressed => {
          this.setCompressedFile(file.id, compressed)
        })
        .catch(err => {
          console.warn(err)
        })
    }
    this.uppy.log(`File ${file.name} is not an image, skipping...`)
    return Promise.resolve()
  }

  compressFile (file) {
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
        reject(new Error('Could not compress image, something went wrong'))
      }
    })

    return onload.then((image) => {
      const width = typeof this.opts.width !== 'number'
        ? image.naturalWidth
        : this.opts.width
      const height = typeof this.opts.height !== 'number'
        ? image.naturalHeight
        : this.opts.height

      const canvas = this.resizeImage(image, width, height)
      return Utils.canvasToBlob(canvas, file.type, this.opts.quality)
    })
  }

  setCompressedFile (fileID, compressedFile) {
    const { files } = this.uppy.state
    const { name, size, progress } = this.uppy.getFile(fileID)
    let diff = Object.assign({}, this.diff)

    this.uppy.setState({
      files: Object.assign({}, files, {
        [fileID]: Object.assign({}, files[fileID], {
          data: compressedFile,
          size: compressedFile.size,
          progress: Object.assign({}, progress, {
            bytesTotal: compressedFile.size
          })
        })
      })
    })

    Object.keys(diff).map(K => {
      const V = String(diff[K])
      diff = Object.assign({}, diff, {
        [K]: V
          .replace(/{file_name}/gi, name)
          .replace(/{origin_size}/gi, bytes(size))
          .replace(/{compressed_size}/gi, bytes(compressedFile.size))
          .replace(/{percent}/gi, `${(Math.round(compressedFile.size * 100) / size).toFixed(2)} %`)
      })
    })

    this.uppy.log(diff.message)
  }

  /**
   * Resize an image to the target `width` and `height`.
   *
   * Returns a Canvas with the resized image on it.
   */
  resizeImage (image, targetWidth, targetHeight) {
    let sourceWidth = image.width
    let sourceHeight = image.height

    if (targetHeight < image.height / 2) {
      const steps = Math.floor(Math.log(image.width / targetWidth) / Math.log(2))
      const stepScaled = this.downScaleInSteps(image, steps)
      image = stepScaled.image
      sourceWidth = stepScaled.sourceWidth
      sourceHeight = stepScaled.sourceHeight
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext('2d')
    context.drawImage(image,
      0, 0, sourceWidth, sourceHeight,
      0, 0, targetWidth, targetHeight)

    return canvas
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
      context.drawImage(source,
        // The entire source image. We pass width and height here,
        // because we reuse this canvas, and should only scale down
        // the part of the canvas that contains the previous scale step.
        0, 0, currentWidth, currentHeight,
        // Draw to 50% size
        0, 0, currentWidth / 2, currentHeight / 2)
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

  install () {
    this.uppy.on('file-added', this.addToQueue)
  }

  uninstall () {
    this.uppy.off('file-added', this.addToQueue)
  }
}
