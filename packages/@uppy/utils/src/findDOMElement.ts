import isDOMElement from './isDOMElement.ts'

function findDOMElement<T>(
  element: T,
  context?: Document,
): T extends Element ? T
: T extends Node | string ? Element | null
: null

function findDOMElement(
  element: Element | Node | string | null,
  context: Document = document,
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
