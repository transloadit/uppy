/**
 * Check if an object is a DOM element. Duck-typing based on `nodeType`.
 *
 * @param {*} obj
 */
export default function isDOMElement (obj) {
  return obj?.nodeType === Node.ELEMENT_NODE
}
