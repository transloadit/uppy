import isDOMElement from './isDOMElement.ts'

function findDOMElement(element: Element, context?: Document): Element
function findDOMElement(
  element: string | Node,
  context?: Document,
): Element | null
function findDOMElement(element: any, context?: Document): null

/**
 * Find a DOM element.
 */
function findDOMElement(element: unknown, context = document): unknown {
  if (typeof element === 'string') {
    return context.querySelector(element)
  }

  if (isDOMElement(element)) {
    return element
  }

  return null
}

export default findDOMElement
