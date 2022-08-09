import isDOMElement from './isDOMElement.js'

/**
 * Find a DOM element.
 *
 * @param {Node|string} element
 * @returns {Node|null}
 */
export default function findDOMElement (element, context = document) {
  if (typeof element === 'string') {
    return context.querySelector(element)
  }

  if (isDOMElement(element)) {
    return element
  }

  return null
}
