/**
 * Converts list into array
*/
module.exports = function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}
