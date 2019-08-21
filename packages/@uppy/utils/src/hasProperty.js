module.exports = function has (object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}
