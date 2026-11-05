import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Locale } from '@uppy/core/utils'
import { glob } from 'glob'

export function getPaths(globPath: string): Promise<string[]> {
  return glob(globPath)
}

export function sortObjectAlphabetically<Obj extends {}>(obj: Obj): Obj {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
  ) as Obj
}

export function omit<Obj extends {}, Key extends keyof Obj>(
  object: Obj,
  key: Key,
): Omit<Obj, Key> {
  const copy = { ...object }
  delete copy[key]
  return copy
}

// Default key derivation, for the per-plugin layout:
// `packages/@uppy/<plugin>/lib/locale.js` -> `<plugin>`
export function pluginNameFromLocalePath(filePath: string): string {
  return path.basename(path.join(filePath, '..', '..'))
}

// Key derivation for the locale pack layout:
// `packages/@uppy/locales/lib/ja_JP.js` -> `ja_JP`
export function localeNameFromLocalePath(filePath: string): string {
  return path.basename(filePath, path.extname(filePath))
}

export async function getLocales(
  pathPattern: string,
  getKey = pluginNameFromLocalePath,
): Promise<Record<string, Locale>> {
  const paths = await getPaths(pathPattern)

  return Object.fromEntries(
    await Promise.all(
      paths.map(async (filePath) => {
        const { default: locale } = await import(
          String(pathToFileURL(filePath))
        )

        return [getKey(filePath), locale]
      }),
    ),
  )
}
