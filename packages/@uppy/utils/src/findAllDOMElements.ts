import isDOMElement from './isDOMElement.js'

function findAllDOMElements<T>(
  element: T,
  context?: ParentNode,
): T extends Element ? [T] : T extends Node | string ? Element[] | null : null

/**
 * Find one or more DOM elements.
 */
function findAllDOMElements(element: unknown): Node[] | null {
  if (typeof element === 'string') {
    const elements = document.querySelectorAll(element)
    return elements.length === 0 ? null : Array.from(elements)
  }

  if (typeof element === 'object' && isDOMElement(element)) {
    return [element]
  }

  return null
}

export default findAllDOMElements
