/**
 * Check if an object is a DOM element. Duck-typing based on `nodeType`.
 *
 * @param {*} obj
 */
module.exports = function isDOMElement (obj) {
  return obj?.nodeType === Node.ELEMENT_NODE
}
