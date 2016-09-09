import mime from 'mime-types'

/**
 * A collection of small utility functions that help with dom manipulation, adding listeners,
 * promises and other good things.
 *
 * @module Utils
 */

/**
 * Shallow flatten nested arrays.
 */
export function flatten (arr) {
  return [].concat.apply([], arr)
}

export function isTouchDevice () {
  return 'ontouchstart' in window || // works on most browsers
          navigator.maxTouchPoints   // works on IE10/11 and Surface
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
export function $ (selector, ctx) {
  return (ctx || document).querySelector(selector)
}

/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String|Array } selector - DOM selector or nodes list
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
export function $$ (selector, ctx) {
  var els
  if (typeof selector === 'string') {
    els = (ctx || document).querySelectorAll(selector)
  } else {
    els = selector
    return Array.prototype.slice.call(els)
  }
}

export function truncateString (str, length) {
  if (str.length > length) {
    return str.substr(0, length / 2) + '...' + str.substr(str.length - length / 4, str.length)
  }
  return str

  // more precise version if needed
  // http://stackoverflow.com/a/831583
}

export function secondsToTime (rawSeconds) {
  const hours = Math.floor(rawSeconds / 3600) % 24
  const minutes = Math.floor(rawSeconds / 60) % 60
  const seconds = Math.floor(rawSeconds % 60)

  return { hours, minutes, seconds }
}

/**
 * Partition array by a grouping function.
 * @param  {[type]} array      Input array
 * @param  {[type]} groupingFn Grouping function
 * @return {[type]}            Array of arrays
 */
export function groupBy (array, groupingFn) {
  return array.reduce((result, item) => {
    let key = groupingFn(item)
    let xs = result.get(key) || []
    xs.push(item)
    result.set(key, xs)
    return result
  }, new Map())
}

/**
 * Tests if every array element passes predicate
 * @param  {Array}  array       Input array
 * @param  {Object} predicateFn Predicate
 * @return {bool}               Every element pass
 */
export function every (array, predicateFn) {
  return array.reduce((result, item) => {
    if (!result) {
      return false
    }

    return predicateFn(item)
  }, true)
}

/**
 * Converts list into array
*/
export function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}

/**
 * Takes a fileName and turns it into fileID, by converting to lowercase,
 * removing extra characters and adding unix timestamp
 *
 * @param {String} fileName
 *
 */
export function generateFileID (fileName) {
  let fileID = fileName.toLowerCase()
  fileID = fileID.replace(/[^A-Z0-9]/ig, '')
  fileID = fileID + Date.now()
  return fileID
}

export function extend (...objs) {
  return Object.assign.apply(this, [{}].concat(objs))
}

/**
 * Takes function or class, returns its name.
 * Because IE doesn’t support `constructor.name`.
 * https://gist.github.com/dfkaye/6384439, http://stackoverflow.com/a/15714445
 *
 * @param {Object} fn — function
 *
 */
// function getFnName (fn) {
//   var f = typeof fn === 'function'
//   var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/))
//   return (!f && 'not a function') || (s && s[1] || 'anonymous')
// }

export function getProportionalImageHeight (img, newWidth) {
  var aspect = img.width / img.height
  var newHeight = Math.round(newWidth / aspect)
  return newHeight
}

export function getFileType (file) {
  if (file.type) {
    return file.type
  }
  return mime.lookup(file.name)
}

// returns [fileName, fileExt]
export function getFileNameAndExtension (fullFileName) {
  var re = /(?:\.([^.]+))?$/
  var fileExt = re.exec(fullFileName)[1]
  var fileName = fullFileName.replace('.' + fileExt, '')
  return [fileName, fileExt]
}

/**
 * Reads file as data URI from file object,
 * the one you get from input[type=file] or drag & drop.
 *
 * @param {Object} file object
 * @return {Promise} dataURL of the file
 *
 */
export function readFile (fileObj) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', function (ev) {
      return resolve(ev.target.result)
    })
    reader.readAsDataURL(fileObj)
  })
}

/**
 * Resizes an image to specified width and height, using canvas
 * See https://davidwalsh.name/resize-image-canvas,
 * http://babalan.com/resizing-images-with-javascript/
 * @TODO see if we need https://github.com/stomita/ios-imagefile-megapixel for iOS
 *
 * @param {Object} img element
 * @param {String} width of the resulting image
 * @param {String} height of the resulting image
 * @return {String} dataURL of the resized image
 */
export function createImageThumbnail (imgURL) {
  return new Promise((resolve, reject) => {
    var img = new Image()
    img.addEventListener('load', () => {
      const newImageWidth = 200
      const newImageHeight = getProportionalImageHeight(img, newImageWidth)

      // create an off-screen canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // set its dimension to target size
      canvas.width = newImageWidth
      canvas.height = newImageHeight

      // draw source image into the off-screen canvas:
      // ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, newImageWidth, newImageHeight)

      // encode image to data-uri with base64 version of compressed image
      // canvas.toDataURL('image/jpeg', quality);  // quality = [0.0, 1.0]
      const thumbnail = canvas.toDataURL('image/png')
      return resolve(thumbnail)
    })
    img.src = imgURL
  })
}

export function dataURItoBlob (dataURI, opts, toFile) {
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

export function dataURItoFile (dataURI, opts) {
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
export function copyToClipboard (textToCopy, fallbackString) {
  fallbackString = fallbackString || 'Copy the URL below'

  return new Promise((resolve, reject) => {
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

    const magicCopyFailed = (err) => {
      document.body.removeChild(textArea)
      window.prompt(fallbackString, textToCopy)
      return reject('Oops, unable to copy displayed fallback prompt: ' + err)
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

export default {
  generateFileID,
  toArray,
  every,
  flatten,
  groupBy,
  $,
  $$,
  extend,
  readFile,
  createImageThumbnail,
  getProportionalImageHeight,
  isTouchDevice,
  getFileNameAndExtension,
  truncateString,
  getFileType,
  secondsToTime,
  dataURItoBlob,
  dataURItoFile
}
