const isDOMElement = require('./isDOMElement')

/**
 * Find a DOM element.
 *
 * @param {Node|string} element
 * @return {Node|null}
 */
module.exports = function findDOMElement (element) {
  if (typeof element === 'string') {
    return document.querySelector(element)
  }

  if (typeof element === 'object' && isDOMElement(element)) {
    return element
  }
}
