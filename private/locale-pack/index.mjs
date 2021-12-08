/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import fs from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import dedent from 'dedent'
import { remark } from 'remark'
import { headingRange } from 'mdast-util-heading-range'
import remarkFrontmatter from 'remark-frontmatter'

import remarkConfig from '../remark-lint-uppy/index.js'

import { getPaths, sortObjectAlphabetically } from './helpers.mjs'

const { settings: remarkSettings } = remarkConfig

const root = fileURLToPath(new URL('../../', import.meta.url))

const localesPath = path.join(root, 'packages', '@uppy', 'locales')
const templatePath = path.join(localesPath, 'template.js')
const englishLocalePath = path.join(localesPath, 'src', 'en_US.js')

main()
  .then(() => {
    console.log(`✅ Generated '${englishLocalePath}'`)
    console.log('✅ Generated locale docs')
    console.log('✅ Generated types')
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

function main () {
  return getPaths(`${root}/packages/@uppy/**/src/locale.js`)
    .then(importFiles)
    .then(createCombinedLocale)
    .then(({ combinedLocale, locales }) => ({
      combinedLocale: sortObjectAlphabetically(combinedLocale),
      locales,
    }))
    .then(({ combinedLocale, locales }) => {
      return readFile(templatePath, 'utf-8')
        .then((fileString) => populateTemplate(fileString, combinedLocale))
        .then((file) => writeFile(englishLocalePath, file))
        .then(() => {
          for (const [pluginName, locale] of Object.entries(locales)) {
            generateLocaleDocs(pluginName)
            generateTypes(pluginName, locale)
          }
          return locales
        })
    })
}

async function importFiles (paths) {
  const locales = {}

  for (const filePath of paths) {
    const pluginName = path.basename(path.join(filePath, '..', '..'))
    // Note: `.default` should be removed when we move to ESM
    const locale = (await import(filePath)).default

    locales[pluginName] = locale
  }

  return locales
}

function createCombinedLocale (locales) {
  return new Promise((resolve, reject) => {
    const combinedLocale = {}
    const entries = Object.entries(locales)

    for (const [pluginName, locale] of entries) {
      Object.entries(locale.strings).forEach(([key, value]) => {
        if (key in combinedLocale && value !== combinedLocale[key]) {
          reject(new Error(`'${key}' from ${pluginName} already exists in locale pack.`))
        }
        combinedLocale[key] = value
      })
    }

    resolve({ combinedLocale, locales })
  })
}

function populateTemplate (fileString, combinedLocale) {
  const formattedLocale = JSON.stringify(combinedLocale, null, ' ')
  return fileString.replace('en_US.strings = {}', `en_US.strings = ${formattedLocale}`)
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
    'generatedLocale.d.ts'
  )

  const localeTypes = dedent`
  /* eslint-disable */
  import type { Locale } from '@uppy/core'

  type ${pluginClassName}Locale = Locale<
    ${allowedStringTypes}
  >

  export default ${pluginClassName}Locale
  `

  fs.writeFileSync(localePath, localeTypes)
}

function generateLocaleDocs (pluginName) {
  const fileName = `${pluginName}.md`
  const docPath = path.join(root, 'website', 'src', 'docs', fileName)
  const localePath = path.join(root, 'packages', '@uppy', pluginName, 'src', 'locale.js')
  const rangeOptions = { test: 'locale: {}', ignoreFinalDefinitions: true }

  if (!fs.existsSync(docPath)) {
    console.error(
      `⚠️  Could not find markdown documentation file for "${pluginName}". Make sure the plugin name matches the markdown file name.`
    )
    return
  }

  remark()
    .data('settings', remarkSettings)
    .use(remarkFrontmatter)
    .use(() => (tree) => {
      // Replace all nodes after the locale heading until the next heading (or eof)
      headingRange(tree, rangeOptions, (start, _, end) => [
        start,
        {
          type: 'html',
          // `module.exports` is not allowed by eslint in our docs.
          // The script outputs an extra newline which also isn't excepted by eslint
          value: '<!-- eslint-disable no-restricted-globals, no-multiple-empty-lines -->',
        },
        {
          type: 'code',
          lang: 'js',
          meta: null,
          value: fs.readFileSync(localePath, 'utf-8'),
        },
        end,
      ])
    })
    .process(fs.readFileSync(docPath))
    .then((file) => fs.writeFileSync(docPath, String(file)))
}
