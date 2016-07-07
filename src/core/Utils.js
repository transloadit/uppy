/**
 * A collection of small utility functions that help with dom manipulation, adding listeners,
 * promises and other good things.
 *
 * @module Utils
 */

/**
 * Runs a waterfall of promises: calls each task, passing the result
 * from the previous one as an argument. The first task is run with an empty array.
 *
 * @memberof Utils
 * @param {array} methods of Promises to run waterfall on
 * @return {Promise} of the final task
 */
function promiseWaterfall (methods) {
  const [resolvedPromise, ...tasks] = methods
  const finalTaskPromise = tasks.reduce((prevTaskPromise, task) => {
    return prevTaskPromise.then(task)
  }, resolvedPromise([])) // initial value

  return finalTaskPromise
}

/**
 * Shallow flatten nested arrays.
 */
function flatten (arr) {
  return [].concat.apply([], arr)
}

/**
 * `querySelectorAll` that returns a normal array instead of fileList
 */
function qsa (selector, context) {
  return Array.prototype.slice.call((context || document).querySelectorAll(selector) || [])
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
function getFnName (fn) {
  var f = typeof fn === 'function'
  var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/))
  return (!f && 'not a function') || (s && s[1] || 'anonymous')
}

/**
 * Reads image as data URI from file object,
 * the one you get from input[type=file] or drag & drop.
 * This will only read image files, skipping others
 *
 * @param {Object} imgObject
 * @param {Function} cb callback that will be called once the image is read
 *
 */
function readImage (imgObject, cb) {
  // if (!imgObject.type.match(/image.*/)) {
  //   console.log('The file is not an image: ', imgObject.type)
  //   return
  // }

  var reader = new FileReader()
  reader.addEventListener('load', function (ev) {
    var imgSrcBase64 = ev.target.result
    var img = new Image()
    img.onload = function () {
      return cb(img)
    }
    img.src = imgSrcBase64
  })
  reader.addEventListener('error', function (err) {
    console.log('FileReader error' + err)
  })
  reader.readAsDataURL(imgObject)
}

function getProportionalImageHeight (img, newWidth) {
  var aspect = img.width / img.height
  var newHeight = Math.round(newWidth / aspect)
  return newHeight
}

/**
 * Resizes an image to specified width and height, using canvas
 * See https://davidwalsh.name/resize-image-canvas
 *
 * @param {Object} img element
 * @param {String} width of the resulting image
 * @param {String} height of the resulting image
 * @return {String} dataURL of the resized image
 */
function resizeImage (img, width, height) {
  // create an off-screen canvas
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')

  // set its dimension to target size
  canvas.width = width
  canvas.height = height

  // draw source image into the off-screen canvas:
  ctx.drawImage(img, 0, 0, width, height)

  // encode image to data-uri with base64 version of compressed image
  // canvas.toDataURL('image/jpeg', quality);  // quality = [0.0, 1.0]
  return canvas.toDataURL()
}

export default {
  promiseWaterfall,
  generateFileID,
  getFnName,
  toArray,
  every,
  flatten,
  groupBy,
  qsa,
  extend,
  readImage,
  resizeImage,
  getProportionalImageHeight
}
