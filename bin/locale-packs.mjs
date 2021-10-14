/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'

import glob from 'glob'
import chalk from 'chalk'
import dedent from 'dedent'
import stringifyObject from 'stringify-object'
import remark from 'remark'
import { headingRange } from 'mdast-util-heading-range'
import remarkFrontmatter from 'remark-frontmatter'
import Task from 'data.task'

import { settings as remarkSettings } from '../private/remark-lint-uppy/index.js'

const require = createRequire(import.meta.url)

main().fork(
  function onError(error) {
    console.error(error)
    process.exit(1)
  },
  function onSuccess(data) {
    console.log(data)
  }
)

function main() {
  const localesPath = path.join('packages', '@uppy', 'locales')
  const templatePath = path.join(localesPath, 'template.js')
  const englishLocalePath = path.join(localesPath, 'src', 'en_US.js')

  return getPaths('packages/@uppy/**/src/locale.js')
    .map(requireFiles)
    .map(createCombinedLocale)
    .map(({ combinedLocale, locales }) => ({
      combinedLocale: sortObjectAlphabetically(combinedLocale),
      locales,
    }))
    .chain(({ combinedLocale }) => {
      return readFile(templatePath).map((string) => {
        return string.replace(
          'en_US.strings = {}',
          `en_US.strings = ${JSON.stringify(combinedLocale, null, 2)}`
        )
      })
    })
    .chain(file => writeFile(englishLocalePath, file))
}

function getPaths(globPath) {
  return new Task((reject, resolve) => {
    glob(globPath, (error, paths) => {
      if (error) reject(error)
      else resolve(paths)
    })
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

function sortObjectAlphabetically(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  )
}

function readFile(filePath) {
  return new Task((reject, resolve) => {
    fs.readFile(filePath, 'utf-8', (error, data) => {
      if (error) reject(error)
      else resolve(data)
    })
  })
}

function writeFile(filePath, data) {
  return new Task((reject, resolve) => {
    fs.writeFile(filePath, data, (error) => {
      if (error) reject(error)
      else resolve(data)
    })
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

function generateLocaleDocs(plugin, pluginName) {
  const fileName = `${pluginName}.md`
  const docPath = path.join('..', 'website', 'src', 'docs', fileName)

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
          value: JSON.stringify(plugin.defaultLocale, null, 2),
        },
        end,
      ])
    })
    .process(fs.readFileSync(docPath))
    .then((file) => fs.writeFileSync(docPath, String(file)))
}
