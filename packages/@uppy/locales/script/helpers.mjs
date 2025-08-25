import path from 'node:path'
import { pathToFileURL } from 'node:url'

import glob from 'glob'

export function getPaths(globPath) {
  return new Promise((resolve, reject) => {
    glob(globPath, (error, paths) => {
      if (error) reject(error)
      else resolve(paths)
    })
  })
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

export async function getLocales(pathPattern) {
  const paths = await getPaths(pathPattern)

  return Object.fromEntries(
    await Promise.all(
      paths.map(async (filePath) => {
        const pluginName = path.basename(path.join(filePath, '..', '..'))
        const { default: locale } = await import(pathToFileURL(filePath))

        return [pluginName, locale]
      }),
    ),
  )
}
