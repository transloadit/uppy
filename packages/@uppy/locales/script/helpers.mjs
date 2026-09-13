import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { glob } from 'glob'

export function getPaths(globPath) {
  return glob(globPath)
}

export function sortObjectAlphabetically(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
  )
}

export function omit(object, key) {
  const copy = { ...object }
  delete copy[key]
  return copy
}

// Default key derivation, for the per-plugin layout:
// `packages/@uppy/<plugin>/lib/locale.js` -> `<plugin>`
export function pluginNameFromLocalePath(filePath) {
  return path.basename(path.join(filePath, '..', '..'))
}

// Key derivation for the locale pack layout:
// `packages/@uppy/locales/lib/ja_JP.js` -> `ja_JP`
export function localeNameFromLocalePath(filePath) {
  return path.basename(filePath, path.extname(filePath))
}

export async function getLocales(
  pathPattern,
  getKey = pluginNameFromLocalePath,
) {
  const paths = await getPaths(pathPattern)

  return Object.fromEntries(
    await Promise.all(
      paths.map(async (filePath) => {
        const { default: locale } = await import(pathToFileURL(filePath))

        return [getKey(filePath), locale]
      }),
    ),
  )
}
