'use strict'

/**
 * This module serves as an Async wrapper for LocalStorage
 */
export function setItem (key, value) {
  return new Promise((resolve) => {
    localStorage.setItem(key, value)
    resolve()
  })
}

export function getItem (key) {
  return Promise.resolve(localStorage.getItem(key))
}

export function removeItem (key) {
  return new Promise((resolve) => {
    localStorage.removeItem(key)
    resolve()
  })
}
