/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import dedent from 'dedent'

import { getLocales, sortObjectAlphabetically } from './helpers.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))

const localesPath = path.join(root, 'packages', '@uppy', 'locales')
const templatePath = path.join(localesPath, 'template.js')
const englishLocalePath = path.join(localesPath, 'src', 'en_US.js')

async function getLocalesAndCombinedLocale () {
  const locales = await getLocales(`${root}/packages/@uppy/**/lib/locale.js`)

  const combinedLocale = {}
  for (const [pluginName, locale] of Object.entries(locales)) {
    for (const [key, value] of Object.entries(locale.strings)) {
      if (key in combinedLocale && value !== combinedLocale[key]) {
        throw new Error(`'${key}' from ${pluginName} already exists in locale pack.`)
      }
      combinedLocale[key] = value
    }
  }

  return [locales, sortObjectAlphabetically(combinedLocale)]
}

function generateTypes (pluginName, locale) {
  const allowedStringTypes = Object.keys(locale.strings)
    .map((key) => `  | '${key}'`)
    .join('\n')
  const pluginClassName = pluginName
    .split('-')
    .map((str) => str.replace(/^\w/, (c) => c.toUpperCase()))
    .join('')

  const localePath = path.join(
    root,
    'packages',
    '@uppy',
    pluginName,
    'types',
    'generatedLocale.d.ts',
  )

  const localeTypes = dedent`
  /* eslint-disable */
  import type { Locale } from '@uppy/core'

  type ${pluginClassName}Locale = Locale<
    ${allowedStringTypes}
  >

  export default ${pluginClassName}Locale
  `

  return writeFile(localePath, localeTypes)
}

const [[locales, combinedLocale], fileString] = await Promise.all([
  getLocalesAndCombinedLocale(),
  readFile(templatePath, 'utf-8'),
])
const formattedLocale = JSON.stringify(combinedLocale, null, ' ')

await Promise.all([
  // Populate template
  writeFile(
    englishLocalePath,
    fileString.replace('en_US.strings = {}', `en_US.strings = ${formattedLocale}`),
  ).then(() => console.log(`✅ Generated '${englishLocalePath}'`)),
  // Create locale files
  ...Object.entries(locales).flatMap(([pluginName, locale]) => [
    generateTypes(pluginName, locale).then(() => console.log(`✅ Generated types for ${pluginName}`)),
  ]),
])
