import isDOMElement from './isDOMElement.ts'

export default function findDOMElement<E, ReturnType = Element>(
  element: E,
  context: Document = document,
): ReturnType extends Element ? ReturnType
: ReturnType extends Node | string ? Element | null
: null {
  if (typeof element === 'string') {
    // @ts-expect-error ????
    return context.querySelector(element)
  }

  if (isDOMElement(element)) {
    // @ts-expect-error ????
    return element
  }

  // @ts-expect-error ????
  return null
}
