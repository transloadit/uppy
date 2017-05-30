const throttle = require('lodash.throttle')
// import mime from 'mime-types'
// import pica from 'pica'

/**
 * A collection of small utility functions that help with dom manipulation, adding listeners,
 * promises and other good things.
 *
 * @module Utils
 */

/**
 * Shallow flatten nested arrays.
 */
function flatten (arr) {
  return [].concat.apply([], arr)
}

function isTouchDevice () {
  return 'ontouchstart' in window || // works on most browsers
          navigator.maxTouchPoints   // works on IE10/11 and Surface
}

// /**
//  * Shorter and fast way to select a single node in the DOM
//  * @param   { String } selector - unique dom selector
//  * @param   { Object } ctx - DOM node where the target of our search will is located
//  * @returns { Object } dom node found
//  */
// function $ (selector, ctx) {
//   return (ctx || document).querySelector(selector)
// }

// /**
//  * Shorter and fast way to select multiple nodes in the DOM
//  * @param   { String|Array } selector - DOM selector or nodes list
//  * @param   { Object } ctx - DOM node where the targets of our search will is located
//  * @returns { Object } dom nodes found
//  */
// function $$ (selector, ctx) {
//   var els
//   if (typeof selector === 'string') {
//     els = (ctx || document).querySelectorAll(selector)
//   } else {
//     els = selector
//     return Array.prototype.slice.call(els)
//   }
// }

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
 * Partition array by a grouping function.
 * @param  {[type]} array      Input array
 * @param  {[type]} groupingFn Grouping function
 * @return {[type]}            Array of arrays
 */
function groupBy (array, groupingFn) {
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
function every (array, predicateFn) {
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
function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}

/**
 * Takes a fileName and turns it into fileID, by converting to lowercase,
 * removing extra characters and adding unix timestamp
 *
 * @param {String} fileName
 *
 */
function generateFileID (fileName) {
  let fileID = fileName.toLowerCase()
  fileID = fileID.replace(/[^A-Z0-9]/ig, '')
  fileID = fileID + Date.now()
  return fileID
}

function extend (...objs) {
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

function getFileType (file) {
  return file.type ? file.type.split('/') : ['', '']
  // return mime.lookup(file.name)
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

// returns [fileName, fileExt]
function getFileNameAndExtension (fullFileName) {
  var re = /(?:\.([^.]+))?$/
  var fileExt = re.exec(fullFileName)[1]
  var fileName = fullFileName.replace('.' + fileExt, '')
  return [fileName, fileExt]
}

function supportsMediaRecorder () {
  return typeof MediaRecorder === 'function' && !!MediaRecorder.prototype &&
    typeof MediaRecorder.prototype.start === 'function'
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

// function createInlineWorker (workerFunction) {
//   let code = workerFunction.toString()
//   code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'))
//
//   const blob = new Blob([code], {type: 'application/javascript'})
//   const worker = new Worker(URL.createObjectURL(blob))
//
//   return worker
// }

// function makeWorker (script) {
//   var URL = window.URL || window.webkitURL
//   var Blob = window.Blob
//   var Worker = window.Worker
//
//   if (!URL || !Blob || !Worker || !script) {
//     return null
//   }
//
//   let code = script.toString()
//   code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'))
//
//   var blob = new Blob([code])
//   var worker = new Worker(URL.createObjectURL(blob))
//   return worker
// }

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

// function makeCachingFunction () {
//   let cachedEl = null
//   let lastUpdate = Date.now()
//
//   return function cacheElement (el, time) {
//     if (Date.now() - lastUpdate < time) {
//       return cachedEl
//     }
//
//     cachedEl = el
//     lastUpdate = Date.now()
//
//     return el
//   }
// }

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
    uploader.core.emitter.emit('core:upload-progress', {
      uploader,
      id: file.id,
      bytesUploaded: bytesUploaded,
      bytesTotal: bytesTotal
    })
  }
}

const emitSocketProgress = throttle(_emitSocketProgress, 300, {leading: true, trailing: true})

module.exports = {
  generateFileID,
  toArray,
  every,
  flatten,
  groupBy,
  // $,
  // $$,
  extend,
  supportsMediaRecorder,
  isTouchDevice,
  getFileNameAndExtension,
  truncateString,
  getFileTypeExtension,
  getFileType,
  secondsToTime,
  dataURItoBlob,
  dataURItoFile,
  getSpeed,
  getBytesRemaining,
  getETA,
  // makeWorker,
  // makeCachingFunction,
  copyToClipboard,
  prettyETA,
  findDOMElement,
  getSocketHost,
  emitSocketProgress
}
