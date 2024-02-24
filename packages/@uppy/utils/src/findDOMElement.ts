import isDOMElement from './isDOMElement.ts'

export default function findDOMElement(
  element: unknown,
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
