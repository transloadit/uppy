/**
 * This module serves as an Async wrapper for LocalStorage
 * Why? Because the Provider API `storage` option allows an async storage
 */

/**
 * @deprecated
 *   Use `defaultStorage` instead.
 */
// biome-ignore lint/suspicious/useAwait: Preserved for backward compatibility
export async function setItem(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value)
}

/**
 * @deprecated
 *   Use `defaultStorage` instead.
 */
// biome-ignore lint/suspicious/useAwait: Preserved for backward compatibility
export async function getItem(key: string): Promise<string | null> {
  return localStorage.getItem(key)
}

/**
 * @deprecated
 *   Use `defaultStorage` instead.
 */
// biome-ignore lint/suspicious/useAwait: Preserved for backward compatibility
export async function removeItem(key: string): Promise<void> {
  localStorage.removeItem(key)
}
