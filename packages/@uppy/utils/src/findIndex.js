/**
 * @param {Array} array
 * @param {Function} predicate
 * @returns {number}
 */
module.exports = Function.prototype.call.bind(Array.prototype.findIndex)
