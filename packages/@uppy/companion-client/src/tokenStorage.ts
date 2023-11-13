'use strict'

/**
 * This module serves as an Async wrapper for LocalStorage
 */
export function setItem (key: Parameters<Storage['setItem']>[0], value:Parameters<Storage['setItem']>[1]): Promise<void> {
  return new Promise((resolve) => {
    localStorage.setItem(key, value)
    resolve()
  })
}

export function getItem (key: Parameters<Storage['getItem']>[0]): Promise<ReturnType<Storage['getItem']>> {
  return Promise.resolve(localStorage.getItem(key))
}

export function removeItem (key: Parameters<Storage['removeItem']>[0]): Promise<void> {
  return new Promise((resolve) => {
    localStorage.removeItem(key)
    resolve()
  })
}
