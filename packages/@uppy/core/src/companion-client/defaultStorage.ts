import type { AsyncStore } from '../index.js'

/**
 * The default `storage` of provider plugins. It uses `localStorage`, but only
 * looks it up when used, so plugins can still be constructed where accessing
 * `localStorage` throws (server-side rendering, blocked site data).
 */
export const defaultStorage: AsyncStore = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
}
