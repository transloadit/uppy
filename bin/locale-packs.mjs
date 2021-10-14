/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'

import dedent from 'dedent'
import stringifyObject from 'stringify-object'
import remark from 'remark'
import { headingRange } from 'mdast-util-heading-range'
import remarkFrontmatter from 'remark-frontmatter'
import Task from 'data.task'

import { settings as remarkSettings } from '../private/remark-lint-uppy/index.js'

import {
  readFile,
  writeFile,
  getPaths,
  sortObjectAlphabetically,
} from './locale-packs.helpers.mjs'

const require = createRequire(import.meta.url)

const localesPath = path.join('packages', '@uppy', 'locales')
const templatePath = path.join(localesPath, 'template.js')
const englishLocalePath = path.join(localesPath, 'src', 'en_US.js')

main().fork(
  function onError(error) {
    console.error(error)
    process.exit(1)
  },
  function onSuccess() {
    console.log(`✅ Written '${englishLocalePath}'`)
  }
)

function main() {
  return getPaths('packages/@uppy/**/src/locale.js')
    .map(requireFiles)
    .map(createCombinedLocale)
    .map(({ combinedLocale, locales }) => ({
      combinedLocale: sortObjectAlphabetically(combinedLocale),
      locales,
    }))
    .chain(({ combinedLocale, locales }) => {
      return Task.of(() => () => {})
        .ap(writeLocale(combinedLocale))
        .ap(docs(locales))
    })
}

function requireFiles(paths) {
  const locales = {}

  for (const filePath of paths) {
    const pluginName = path.basename(path.join(filePath, '..', '..'))
    // eslint-disable-next-line import/no-dynamic-require
    const locale = require(path.join('..', filePath))

    locales[pluginName] = locale
  }

  return locales
}

function createCombinedLocale(locales) {
  const combinedLocale = {}
  const values = Object.values(locales)

  for (const locale of values) {
    Object.entries(locale.strings).forEach(([key, value]) => {
      combinedLocale[key] = value
    })
  }

  return { combinedLocale, locales }
}

function writeLocale(combinedLocale) {
  return readFile(templatePath)
    .map((string) => {
      return string.replace(
        'en_US.strings = {}',
        `en_US.strings = ${JSON.stringify(combinedLocale, null, 2)}`
      )
    })
    .chain((file) => writeFile(englishLocalePath, file))
}

function docs(locales) {
  return new Task((_, resolve) => {
    const entries = Object.entries(locales)

    for (const [pluginName, locale] of entries) {
      generateLocaleDocs(pluginName, locale)
    }

    resolve()
  })
}

function createTypeScriptLocale(plugin, pluginName) {
  const allowedStringTypes = Object.keys(plugin.defaultLocale.strings)
    .map((key) => `  | '${key}'`)
    .join('\n')

  const pluginClassName = pluginName === 'core' ? 'Core' : plugin.id
  const localePath = path.join(
    __dirname,
    '..',
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

function generateLocaleDocs(pluginName, locale) {
  const fileName = `${pluginName}.md`
  const docPath = path.join('website', 'src', 'docs', fileName)

  if (!fs.existsSync(docPath)) {
    console.error(
      `⚠  Could not find markdown documentation file for "${pluginName}". Make sure the plugin name matches the markdown file name.`
    )
    return
  }

  remark()
    .data('settings', remarkSettings)
    .use(remarkFrontmatter)
    .use(() => (tree) => {
      // Replace all nodes after the locale heading until the next heading (or eof)
      headingRange(tree, 'locale: {}', (start, _, end) => [
        start,
        {
          type: 'code',
          lang: 'json',
          meta: null,
          value: JSON.stringify(locale, null, 2),
        },
        end,
      ])
    })
    .process(fs.readFileSync(docPath))
    .then((file) => fs.writeFileSync(docPath, String(file)))
}
