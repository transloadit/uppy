/**
 * This module serves as an Async wrapper for LocalStorage
 */
module.exports.setItem = (key, value) => new Promise((resolve) => {
  localStorage.setItem(key, value)
  resolve()
})

module.exports.getItem = (key) => Promise.resolve(localStorage.getItem(key))

module.exports.removeItem = (key) => new Promise((resolve) => {
  localStorage.removeItem(key)
  resolve()
})
