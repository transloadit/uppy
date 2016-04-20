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
 * Adds multiple listeners to to a DOM element
 * Equvalent to jQuery’s `$form.on('drag dragstart dragend dragover dragenter dragleave drop')`.
 *
 * @memberof Utils
 * @param {String} el selector
 * @param {String} events to add, like `drag dragstart dragend dragover dragenter dragleave drop`
 * @param {requestCallback} cb
 * @return {String}
 */
function addListenerMulti (el, events, cb) {
  const eventsArray = events.split(' ')
  for (let event in eventsArray) {
    el.addEventListener(eventsArray[event], cb, false)
  }
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

export default {
  promiseWaterfall,
  generateFileID,
  addListenerMulti,
  every,
  flatten,
  groupBy,
  qsa,
  extend
}
