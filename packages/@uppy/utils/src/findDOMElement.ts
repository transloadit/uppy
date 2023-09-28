import isDOMElement from './isDOMElement.ts'

/**
 * Find a DOM element.
 */
export default function findDOMElement(
  element: Node | string,
  context = document,
): Node | null {
  if (typeof element === 'string') {
    return context.querySelector(element)
  }

  if (isDOMElement(element)) {
    return element
  }

  return null
}
