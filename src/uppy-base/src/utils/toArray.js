/**
 * Converts list into array
*/
export function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}
