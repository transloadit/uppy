const isDOMElement = require('./isDOMElement')

/**
 * Find one or more DOM elements.
 *
 * @param {string} element
 * @return {Array|null}
 */
module.exports = function findAllDOMElements (element) {
  if (typeof element === 'string') {
    const elements = [].slice.call(document.querySelectorAll(element))
    return elements.length > 0 ? elements : null
  }

  if (typeof element === 'object' && isDOMElement(element)) {
    return [element]
  }
}
