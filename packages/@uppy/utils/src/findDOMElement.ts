import isDOMElement from './isDOMElement.js'

function findDOMElement<T>(
  element: T,
  context?: ParentNode,
): T extends Element ? T : T extends Node | string ? Element | null : null

function findDOMElement(
  element: unknown,
  context: ParentNode = document,
): Element | null {
  if (typeof element === 'string') {
    return context.querySelector(element)
  }

  if (isDOMElement(element)) {
    return element
  }

  return null
}

export default findDOMElement
