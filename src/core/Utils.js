const throttle = require('lodash.throttle')
// we inline file-type module, as opposed to using the NPM version,
// because of this https://github.com/sindresorhus/file-type/issues/78
// and https://github.com/sindresorhus/copy-text-to-clipboard/issues/5
const fileType = require('../vendor/file-type')

/**
 * A collection of small utility functions that help with dom manipulation, adding listeners,
 * promises and other good things.
 *
 * @module Utils
 */

function isTouchDevice () {
  return 'ontouchstart' in window || // works on most browsers
          navigator.maxTouchPoints   // works on IE10/11 and Surface
}

function truncateString (str, length) {
  if (str.length > length) {
    return str.substr(0, length / 2) + '...' + str.substr(str.length - length / 4, str.length)
  }
  return str

  // more precise version if needed
  // http://stackoverflow.com/a/831583
}

function secondsToTime (rawSeconds) {
  const hours = Math.floor(rawSeconds / 3600) % 24
  const minutes = Math.floor(rawSeconds / 60) % 60
  const seconds = Math.floor(rawSeconds % 60)

  return { hours, minutes, seconds }
}

/**
 * Converts list into array
*/
function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}

/**
 * Returns a timestamp in the format of `hours:minutes:seconds`
*/
function getTimeStamp () {
  var date = new Date()
  var hours = pad(date.getHours().toString())
  var minutes = pad(date.getMinutes().toString())
  var seconds = pad(date.getSeconds().toString())
  return hours + ':' + minutes + ':' + seconds
}

/**
 * Adds zero to strings shorter than two characters
*/
function pad (str) {
  return str.length !== 2 ? 0 + str : str
}

/**
 * Takes a file object and turns it into fileID, by converting file.name to lowercase,
 * removing extra characters and adding type, size and lastModified
 *
 * @param {Object} file
 * @return {String} the fileID
 *
 */
function generateFileID (file) {
  // filter is needed to not join empty values with `-`
  return [
    'uppy',
    file.name ? file.name.toLowerCase().replace(/[^A-Z0-9]/ig, '') : '',
    file.type,
    file.data.size,
    file.data.lastModified
  ].filter(val => val).join('-')
}

/**
 * Runs an array of promise-returning functions in sequence.
 */
function runPromiseSequence (functions, ...args) {
  let promise = Promise.resolve()
  functions.forEach((func) => {
    promise = promise.then(() => func(...args))
  })
  return promise
}

function isPreviewSupported (fileType) {
  if (!fileType) return false
  const fileTypeSpecific = fileType.split('/')[1]
  // list of images that browsers can preview
  if (/^(jpeg|gif|png|svg|svg\+xml|bmp)$/.test(fileTypeSpecific)) {
    return true
  }
  return false
}

function getArrayBuffer (chunk) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.addEventListener('load', function (e) {
      // e.target.result is an ArrayBuffer
      resolve(e.target.result)
    })
    reader.addEventListener('error', function (err) {
      console.error('FileReader error' + err)
      reject(err)
    })
    // file-type only needs the first 4100 bytes
    reader.readAsArrayBuffer(chunk)
  })
}

function getFileType (file) {
  const extensionsToMime = {
    'md': 'text/markdown',
    'markdown': 'text/markdown',
    'mp4': 'video/mp4',
    'mp3': 'audio/mp3',
    'svg': 'image/svg+xml'
  }

  const fileExtension = file.name ? getFileNameAndExtension(file.name).extension : null

  if (file.isRemote) {
    // some remote providers do not support file types
    const mime = file.type ? file.type : extensionsToMime[fileExtension]
    return Promise.resolve(mime)
  }

  // 1. try to determine file type from magic bytes with file-type module
  // this should be the most trustworthy way
  const chunk = file.data.slice(0, 4100)
  return getArrayBuffer(chunk)
    .then((buffer) => {
      const type = fileType(buffer)
      if (type && type.mime) {
        return type.mime
      }

      // 2. if that’s no good, check if mime type is set in the file object
      if (file.type) {
        return file.type
      }

      // 3. if that’s no good, see if we can map extension to a mime type
      if (fileExtension && extensionsToMime[fileExtension]) {
        return extensionsToMime[fileExtension]
      }

      // if all fails, well, return empty
      return null
    })
    .catch(() => {
      return null
    })
}

// TODO Check which types are actually supported in browsers. Chrome likes webm
// from my testing, but we may need more.
// We could use a library but they tend to contain dozens of KBs of mappings,
// most of which will go unused, so not sure if that's worth it.
const mimeToExtensions = {
  'video/ogg': 'ogv',
  'audio/ogg': 'ogg',
  'video/webm': 'webm',
  'audio/webm': 'webm',
  'video/mp4': 'mp4',
  'audio/mp3': 'mp3'
}

function getFileTypeExtension (mimeType) {
  return mimeToExtensions[mimeType] || null
}

/**
* Takes a full filename string and returns an object {name, extension}
*
* @param {string} fullFileName
* @return {object} {name, extension}
*/
function getFileNameAndExtension (fullFileName) {
  var re = /(?:\.([^.]+))?$/
  var fileExt = re.exec(fullFileName)[1]
  var fileName = fullFileName.replace('.' + fileExt, '')
  return {
    name: fileName,
    extension: fileExt
  }
}

/**
 * Check if a URL string is an object URL from `URL.createObjectURL`.
 *
 * @param {string} url
 * @return {boolean}
 */
function isObjectURL (url) {
  return url.indexOf('blob:') === 0
}

function getProportionalHeight (img, width) {
  const aspect = img.width / img.height
  return Math.round(width / aspect)
}

/**
 * Create a thumbnail for the given Uppy file object.
 *
 * @param {{data: Blob}} file
 * @param {number} width
 * @return {Promise}
 */
function createThumbnail (file, targetWidth) {
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

  return onload.then((image) => {
    const targetHeight = getProportionalHeight(image, targetWidth)
    const canvas = resizeImage(image, targetWidth, targetHeight)
    return canvasToBlob(canvas, 'image/png')
  }).then((blob) => {
    return URL.createObjectURL(blob)
  })
}

/**
 * Resize an image to the target `width` and `height`.
 *
 * Returns a Canvas with the resized image on it.
 */
function resizeImage (image, targetWidth, targetHeight) {
  let sourceWidth = image.width
  let sourceHeight = image.height

  if (targetHeight < image.height / 2) {
    const steps = Math.floor(Math.log(image.width / targetWidth) / Math.log(2))
    const stepScaled = downScaleInSteps(image, steps)
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
function downScaleInSteps (image, steps) {
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

/**
 * Save a <canvas> element's content to a Blob object.
 *
 * @param {HTMLCanvasElement} canvas
 * @return {Promise}
 */
function canvasToBlob (canvas, type, quality) {
  if (canvas.toBlob) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality)
    })
  }
  return Promise.resolve().then(() => {
    return dataURItoBlob(canvas.toDataURL(type, quality), {})
  })
}

function dataURItoBlob (dataURI, opts, toFile) {
  // get the base64 data
  var data = dataURI.split(',')[1]

  // user may provide mime type, if not get it from data URI
  var mimeType = opts.mimeType || dataURI.split(',')[0].split(':')[1].split(';')[0]

  // default to plain/text if data URI has no mimeType
  if (mimeType == null) {
    mimeType = 'plain/text'
  }

  var binary = atob(data)
  var array = []
  for (var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i))
  }

  // Convert to a File?
  if (toFile) {
    return new File([new Uint8Array(array)], opts.name || '', {type: mimeType})
  }

  return new Blob([new Uint8Array(array)], {type: mimeType})
}

function dataURItoFile (dataURI, opts) {
  return dataURItoBlob(dataURI, opts, true)
}

/**
 * Copies text to clipboard by creating an almost invisible textarea,
 * adding text there, then running execCommand('copy').
 * Falls back to prompt() when the easy way fails (hello, Safari!)
 * From http://stackoverflow.com/a/30810322
 *
 * @param {String} textToCopy
 * @param {String} fallbackString
 * @return {Promise}
 */
function copyToClipboard (textToCopy, fallbackString) {
  fallbackString = fallbackString || 'Copy the URL below'

  return new Promise((resolve) => {
    const textArea = document.createElement('textarea')
    textArea.setAttribute('style', {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '2em',
      height: '2em',
      padding: 0,
      border: 'none',
      outline: 'none',
      boxShadow: 'none',
      background: 'transparent'
    })

    textArea.value = textToCopy
    document.body.appendChild(textArea)
    textArea.select()

    const magicCopyFailed = () => {
      document.body.removeChild(textArea)
      window.prompt(fallbackString, textToCopy)
      resolve()
    }

    try {
      const successful = document.execCommand('copy')
      if (!successful) {
        return magicCopyFailed('copy command unavailable')
      }
      document.body.removeChild(textArea)
      return resolve()
    } catch (err) {
      document.body.removeChild(textArea)
      return magicCopyFailed(err)
    }
  })
}

function getSpeed (fileProgress) {
  if (!fileProgress.bytesUploaded) return 0

  const timeElapsed = (new Date()) - fileProgress.uploadStarted
  const uploadSpeed = fileProgress.bytesUploaded / (timeElapsed / 1000)
  return uploadSpeed
}

function getBytesRemaining (fileProgress) {
  return fileProgress.bytesTotal - fileProgress.bytesUploaded
}

function getETA (fileProgress) {
  if (!fileProgress.bytesUploaded) return 0

  const uploadSpeed = getSpeed(fileProgress)
  const bytesRemaining = getBytesRemaining(fileProgress)
  const secondsRemaining = Math.round(bytesRemaining / uploadSpeed * 10) / 10

  return secondsRemaining
}

function prettyETA (seconds) {
  const time = secondsToTime(seconds)

  // Only display hours and minutes if they are greater than 0 but always
  // display minutes if hours is being displayed
  // Display a leading zero if the there is a preceding unit: 1m 05s, but 5s
  const hoursStr = time.hours ? time.hours + 'h ' : ''
  const minutesVal = time.hours ? ('0' + time.minutes).substr(-2) : time.minutes
  const minutesStr = minutesVal ? minutesVal + 'm ' : ''
  const secondsVal = minutesVal ? ('0' + time.seconds).substr(-2) : time.seconds
  const secondsStr = secondsVal + 's'

  return `${hoursStr}${minutesStr}${secondsStr}`
}

/**
 * Check if an object is a DOM element. Duck-typing based on `nodeType`.
 *
 * @param {*} obj
 */
function isDOMElement (obj) {
  return obj && typeof obj === 'object' && obj.nodeType === Node.ELEMENT_NODE
}

/**
 * Find a DOM element.
 *
 * @param {Node|string} element
 * @return {Node|null}
 */
function findDOMElement (element) {
  if (typeof element === 'string') {
    return document.querySelector(element)
  }

  if (typeof element === 'object' && isDOMElement(element)) {
    return element
  }
}

/**
 * Find one or more DOM elements.
 *
 * @param {string} element
 * @return {Array|null}
 */
function findAllDOMElements (element) {
  if (typeof element === 'string') {
    const elements = [].slice.call(document.querySelectorAll(element))
    return elements.length > 0 ? elements : null
  }

  if (typeof element === 'object' && isDOMElement(element)) {
    return [element]
  }
}

function getSocketHost (url) {
  // get the host domain
  var regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?(?:www\.)?([^\n]+)/
  var host = regex.exec(url)[1]
  var socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'

  return `${socketProtocol}://${host}`
}

function _emitSocketProgress (uploader, progressData, file) {
  const {progress, bytesUploaded, bytesTotal} = progressData
  if (progress) {
    uploader.core.log(`Upload progress: ${progress}`)
    uploader.core.emit('upload-progress', {
      uploader,
      id: file.id,
      bytesUploaded: bytesUploaded,
      bytesTotal: bytesTotal
    })
  }
}

const emitSocketProgress = throttle(_emitSocketProgress, 300, {leading: true, trailing: true})

function settle (promises) {
  const resolutions = []
  const rejections = []
  function resolved (value) {
    resolutions.push(value)
  }
  function rejected (error) {
    rejections.push(error)
  }

  const wait = Promise.all(
    promises.map((promise) => promise.then(resolved, rejected))
  )

  return wait.then(() => {
    return {
      successful: resolutions,
      failed: rejections
    }
  })
}

/**
 * Limit the amount of simultaneously pending Promises.
 * Returns a function that, when passed a function `fn`,
 * will make sure that at most `limit` calls to `fn` are pending.
 *
 * @param {number} limit
 * @return {function()}
 */
function limitPromises (limit) {
  let pending = 0
  const queue = []
  return (fn) => {
    return (...args) => {
      const call = () => {
        pending++
        const promise = fn(...args)
        promise.then(onfinish, onfinish)
        return promise
      }

      if (pending >= limit) {
        return new Promise((resolve, reject) => {
          queue.push(() => {
            call().then(resolve, reject)
          })
        })
      }
      return call()
    }
  }
  function onfinish () {
    pending--
    const next = queue.shift()
    if (next) next()
  }
}

module.exports = {
  generateFileID,
  toArray,
  getTimeStamp,
  runPromiseSequence,
  isTouchDevice,
  getFileNameAndExtension,
  truncateString,
  getFileTypeExtension,
  getFileType,
  getArrayBuffer,
  isPreviewSupported,
  isObjectURL,
  createThumbnail,
  secondsToTime,
  dataURItoBlob,
  dataURItoFile,
  canvasToBlob,
  getSpeed,
  getBytesRemaining,
  getETA,
  copyToClipboard,
  prettyETA,
  findDOMElement,
  findAllDOMElements,
  getSocketHost,
  emitSocketProgress,
  settle,
  limitPromises
}
