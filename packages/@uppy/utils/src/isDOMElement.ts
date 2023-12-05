/**
 * Check if an object is a DOM element. Duck-typing based on `nodeType`.
 */
export default function isDOMElement(obj: unknown): obj is Element {
  if (typeof obj !== 'object' || obj === null) return false
  if (!('nodeType' in obj)) return false
  return obj.nodeType === Node.ELEMENT_NODE
}
