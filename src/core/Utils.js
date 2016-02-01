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
  const finalTaskPromise = tasks.reduce(function (prevTaskPromise, task) {
    return prevTaskPromise.then(task)
  }, resolvedPromise([]))  // initial value

  return finalTaskPromise
}

/**
 * Toggles a class on a DOM element
 * This is how we roll $('.element').toggleClass in a non-jQuery world
 *
 * @memberof Utils
 * @param {String} el selector
 * @param {String} className to toggle
 * @return {String}
 */
function toggleClass (el, className) {
  if (el.classList) {
    el.classList.toggle(className)
  } else {
    const classes = el.className.split(' ')
    const existingIndex = classes.indexOf(className)

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1)
    } else {
      classes.push(className)
      el.className = classes.join(' ')
    }
  }
}

/**
 * Adds a class to a DOM element
 *
 * @memberof Utils
 * @param {Object} el selector
 * @param {String} className to add
 * @return {String}
 */
function addClass (el, className) {
  if (el.classList) {
    el.classList.add(className)
  } else {
    el.className += ' ' + className
  }
}

/**
 * Removes a class to a DOM element
 *
 * @memberof Utils
 * @param {String} el selector
 * @param {String} className to remove
 * @return {String}
 */
function removeClass (el, className) {
  if (el.classList) {
    el.classList.remove(className)
  } else {
    const patClasses = className.split(' ').join('|')
    const pattern = new RegExp('(^|\\b)' + patClasses + '(\\b|$)', 'gi')

    el.className = el.className.replace(pattern, ' ')
  }
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

export default {
  promiseWaterfall,
  toggleClass,
  addClass,
  removeClass,
  addListenerMulti
}
