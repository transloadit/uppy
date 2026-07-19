/**
 * This module serves as an Async wrapper for LocalStorage
 * Why? Because the Provider API `storage` option allows an async storage
 */
export async function setItem(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value)
}

export async function getItem(key: string): Promise<string | null> {
  return localStorage.getItem(key)
}

export async function removeItem(key: string): Promise<void> {
  localStorage.removeItem(key)
}
