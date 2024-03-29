/**
 * This module serves as an Async wrapper for LocalStorage
 */
export function setItem(key: string, value: string): Promise<void> {
  return new Promise((resolve) => {
    localStorage.setItem(key, value)
    resolve()
  })
}

export function getItem(key: string): Promise<string | null> {
  return Promise.resolve(localStorage.getItem(key))
}

export function removeItem(key: string): Promise<void> {
  return new Promise((resolve) => {
    localStorage.removeItem(key)
    resolve()
  })
}
