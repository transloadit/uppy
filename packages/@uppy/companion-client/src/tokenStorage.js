'use strict'
/**
 * This module serves as an Async wrapper for LocalStorage
 */
module.exports.setItem = (key, value) => {
  return new Promise((resolve) => {
    localStorage.setItem(key, value)
    resolve()
  })
}

module.exports.getItem = (key) => {
  return Promise.resolve(localStorage.getItem(key))
}

module.exports.removeItem = (key) => {
  return new Promise((resolve) => {
    localStorage.removeItem(key)
    resolve()
  })
}
