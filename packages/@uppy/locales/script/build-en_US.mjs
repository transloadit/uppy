// We use locale.ts in all packages.
// They need to be combined into a single file (en_US.ts).

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getLocales, sortObjectAlphabetically } from './helpers.mjs'

const root = fileURLToPath(new URL('../../../../', import.meta.url))

const localesPath = path.join(root, 'packages', '@uppy', 'locales')
const templatePath = path.join(localesPath, 'template.ts')
const englishLocalePath = path.join(localesPath, 'src', 'en_US.ts')

async function getLocalesAndCombinedLocale() {
  const locales = await getLocales(`${root}/packages/@uppy/**/lib/locale.js`)

  const combinedLocale = {}
  for (const [, locale] of Object.entries(locales)) {
    for (const [key, value] of Object.entries(locale.strings)) {
      combinedLocale[key] = value
    }
  }

  return sortObjectAlphabetically(combinedLocale)
}

const [combinedLocale, fileString] = await Promise.all([
  getLocalesAndCombinedLocale(),
  readFile(templatePath, 'utf-8'),
])
const formattedLocale = JSON.stringify(combinedLocale, null, ' ')

await Promise.all([
  // Populate template
  writeFile(
    englishLocalePath,
    fileString.replace(
      'en_US.strings = {}',
      `en_US.strings = ${formattedLocale}`,
    ),
  ),
])
