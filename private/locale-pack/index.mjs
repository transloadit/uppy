/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import fs from 'node:fs'
import { open, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import dedent from 'dedent'
import { remark } from 'remark'
import { headingRange } from 'mdast-util-heading-range'
import remarkFrontmatter from 'remark-frontmatter'

import remarkConfig from '../remark-lint-uppy/index.js'

import { getLocales, sortObjectAlphabetically } from './helpers.mjs'

const { settings: remarkSettings } = remarkConfig

const root = fileURLToPath(new URL('../../', import.meta.url))

const localesPath = path.join(root, 'packages', '@uppy', 'locales')
const templatePath = path.join(localesPath, 'template.js')
const englishLocalePath = path.join(localesPath, 'src', 'en_US.js')

async function getLocalesAndCombinedLocale () {
  const locales = await getLocales(`${root}/packages/@uppy/**/src/locale.js`)

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

async function generateLocaleDocs (pluginName) {
  const fileName = `${pluginName}.md`
  const docPath = path.join(root, 'website', 'src', 'docs', fileName)
  const localePath = path.join(root, 'packages', '@uppy', pluginName, 'src', 'locale.js')
  const rangeOptions = { test: 'locale: {}', ignoreFinalDefinitions: true }

  let docFile

  try {
    docFile = await open(docPath, 'r+')
  } catch (err) {
    console.error(
      `⚠️  Could not find markdown documentation file for "${pluginName}". Make sure the plugin name matches the markdown file name.`,
    )
    throw err
  }

  const file = await remark()
    .data('settings', remarkSettings)
    .use(remarkFrontmatter)
    .use(() => (tree) => {
      // Replace all nodes after the locale heading until the next heading (or eof)
      headingRange(tree, rangeOptions, (start, _, end) => [
        start,
        {
          type: 'code',
          lang: 'js',
          meta: null,
          value: fs.readFileSync(localePath, 'utf-8').trimEnd(),
        },
        end,
      ])
    })
    .process(await docFile.readFile())

  const { bytesWritten } = await docFile.write(String(file), 0, 'utf-8')
  await docFile.truncate(bytesWritten)

  await docFile.close()
}

const [[locales, combinedLocale], fileString] = await Promise.all([
  getLocalesAndCombinedLocale(),
  readFile(templatePath, 'utf-8'),
])
const formattedLocale = JSON.stringify(combinedLocale, null, ' ')

await Promise.all([
  // Populate template
  writeFile(englishLocalePath, fileString.replace('en_US.strings = {}', `en_US.strings = ${formattedLocale}`))
    .then(() => console.log(`✅ Generated '${englishLocalePath}'`)),
  // Create locale files
  ...Object.entries(locales).flatMap(([pluginName, locale]) => [
    generateLocaleDocs(pluginName)
      .then(() => console.log(`✅ Generated locale docs for ${pluginName}`)),
    generateTypes(pluginName, locale)
      .then(() => console.log(`✅ Generated types for ${pluginName}`)),
  ]),
])
