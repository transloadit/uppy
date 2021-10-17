/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import fs from 'node:fs'

import dedent from 'dedent'
import stringifyObject from 'stringify-object'
import remark from 'remark'
import { headingRange } from 'mdast-util-heading-range'
import { ESLint } from 'eslint'
import remarkFrontmatter from 'remark-frontmatter'
import Task from 'data.task'

import { settings as remarkSettings } from '../private/remark-lint-uppy/index.js'

import {
  readFile,
  writeFile,
  getPaths,
  sortObjectAlphabetically,
} from './locale-packs.helpers.mjs'

const localesPath = path.join('packages', '@uppy', 'locales')
const templatePath = path.join(localesPath, 'template.js')
const englishLocalePath = path.join(localesPath, 'src', 'en_US.js')

const linter = new ESLint({ fix: true })

main().fork(
  function onError (error) {
    console.error(error)
    process.exit(1)
  },
  function onSuccess () {
    console.log(`✅ Generated '${englishLocalePath}'`)
    console.log('✅ Generated locale docs')
    console.log('✅ Generated types')
  }
)

function main () {
  return getPaths('packages/@uppy/**/src/locale.js')
    .chain(importFiles)
    .map(createCombinedLocale)
    .map(({ combinedLocale, locales }) => ({
      combinedLocale: sortObjectAlphabetically(combinedLocale),
      locales,
    }))
    .chain(({ combinedLocale, locales }) => {
      return readFile(templatePath)
        .map((fileString) => populateTemplate(fileString, combinedLocale))
        .chain(lint)
        .chain((file) => writeFile(englishLocalePath, file))
        .map(() => {
          for (const [pluginName, locale] of Object.entries(locales)) {
            generateLocaleDocs(pluginName, locale)
            generateTypes(pluginName, locale)
          }
          return locales
        })
    })
}

function importFiles (paths) {
  return new Task(async (_, resolve) => {
    const locales = {}

    for (const filePath of paths) {
      const pluginName = path.basename(path.join(filePath, '..', '..'))
      // Note: `.default` should be removed when we move to ESM
      const locale = (await import(path.join('..', filePath))).default

      locales[pluginName] = locale
    }

    resolve(locales)
  })
}

function createCombinedLocale (locales) {
  const combinedLocale = {}
  const values = Object.values(locales)

  for (const locale of values) {
    Object.entries(locale.strings).forEach(([key, value]) => {
      combinedLocale[key] = value
    })
  }

  return { combinedLocale, locales }
}

function populateTemplate (fileString, combinedLocale) {
  const formattedLocale = stringifyObject(combinedLocale, {
    indent: '  ',
    singleQuotes: true,
    inlineCharacterLimit: 12,
  })
  return fileString.replace('en_US.strings = {}', `en_US.strings = ${formattedLocale}`)
}

function lint (fileString) {
  return new Task((reject, resolve) => {
    linter.lintText(fileString)
      .then(([result]) => resolve(result.output))
      .catch(reject)
  })
}

function generateTypes (pluginName, locale) {
  const allowedStringTypes = Object.keys(locale.strings)
    .map((key) => `  | '${key}'`)
    .join('\n')
  const pluginClassName = pluginName.split('-')
    .map(str => str.replace(/^\w/, (c) => c.toUpperCase()))
    .join('')

  const localePath = path.join(
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

function generateLocaleDocs (pluginName, locale) {
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
