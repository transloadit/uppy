import isDOMElement from './isDOMElement.ts'

export default function findDOMElement<T>(
  element: T,
  context: Document = document,
): T extends Element ? T
: T extends Node | string ? Element | null
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
