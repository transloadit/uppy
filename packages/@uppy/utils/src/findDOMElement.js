const isDOMElement = require('./isDOMElement')

/**
 * Find a DOM element.
 *
 * @param {Node|string} element
 * @returns {Node|null}
 */
module.exports = function findDOMElement (element, context = document) {
  if (typeof element === 'string') {
    return context.querySelector(element)
  }

  if (isDOMElement(element)) {
    return element
  }
}
