/* eslint-disable no-console */
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'

import glob from 'glob'
import { ESLint } from 'eslint'
import chalk from 'chalk'
import dedent from 'dedent'
import stringifyObject from 'stringify-object'
import remark from 'remark'
import { headingRange } from 'mdast-util-heading-range'
import remarkFrontmatter from 'remark-frontmatter'

import { Uppy } from '@uppy/core'

import { settings as remarkSettings } from '../private/remark-lint-uppy/index.js'

// TODO: this will break once we move to ESM
const require = createRequire(import.meta.url)

const uppy = new Uppy()

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getSources (pluginName) {
  const dependencies = {
    // because 'provider-views' doesn't have its own locale, it uses Core's defaultLocale
    core: ['provider-views'],
  }

  const globPath = path.join(__dirname, '..', 'packages', '@uppy', pluginName, 'lib', '**', '*.js')
  let contents = glob.sync(globPath).map((file) => {
    return fs.readFileSync(file, 'utf-8')
  })

  if (dependencies[pluginName]) {
    dependencies[pluginName].forEach((addPlugin) => {
      contents = contents.concat(getSources(addPlugin))
    })
  }

  return contents
}

async function buildPluginsList () {
  const plugins = {}
  const sources = {}

  // Go over all uppy plugins, check if they are constructors
  // and instanciate them, check for defaultLocale property,
  // then add to plugins object

  const packagesGlobPath = path.join(__dirname, '..', 'packages', '@uppy', '*', 'package.json')
  const files = glob.sync(packagesGlobPath)

  console.log('--> Checked plugins could be instantiated and have defaultLocale in them:\n')
  for (const file of files) {
    const dirName = path.dirname(file)
    const pluginName = path.basename(dirName)
    if (pluginName === 'locales'
        || pluginName === 'react-native'
        || pluginName === 'vue'
        || pluginName === 'svelte'
        || pluginName === 'angular') {
      continue // eslint-disable-line no-continue
    }
    // const Plugin = (await import(`${dirName}/lib/index.js`)).default // eslint-disable-line global-require, import/no-dynamic-require
    const Plugin = require(dirName)
    let plugin

    // A few hacks to emulate browser environment because e.g.:
    // GoldenRetrieves calls upon MetaDataStore in the constructor, which uses localStorage
    // @TODO Consider rewriting constructors so they don't make imperative calls that rely on browser environment
    // (OR: just keep this browser mocking, if it's only causing issues for this script, it doesn't matter)
    global.location = { protocol: 'https' }
    global.navigator = { userAgent: '' }
    global.localStorage = {
      key: () => { },
      getItem: () => { },
    }
    global.window = {
      indexedDB: {
        open: () => { return {} },
      },
    }
    global.document = {
      createElement: () => {
        return { style: {} }
      },
      get body () { return this.createElement() },
    }

    try {
      if (pluginName === 'provider-views') {
        plugin = new Plugin(plugins['drag-drop'], {
          companionPattern: '',
          companionUrl: 'https://companion.uppy.io',
        })
      } else if (pluginName === 'store-redux') {
        plugin = new Plugin({ store: { dispatch: () => { } } })
      } else {
        plugin = new Plugin(uppy, {
          companionPattern: '',
          companionUrl: 'https://companion.uppy.io',
          params: {
            auth: {
              key: 'x',
            },
          },
        })
      }
    } catch (err) {
      if (err.message !== 'Plugin is not a constructor') {
        console.error(`--> While trying to instantiate plugin: ${pluginName}, this error was thrown: `)
        throw err
      }
    }

    if (plugin && plugin.defaultLocale) {
      console.log(`[x] Check plugin: ${pluginName}`)
      plugins[pluginName] = plugin
      sources[pluginName] = getSources(pluginName)
    } else {
      console.log(`[ ] Check plugin: ${pluginName}`)
    }
  }

  return { plugins, sources }
}

function addLocaleToPack (localePack, plugin, pluginName) {
  const localeStrings = plugin.defaultLocale.strings

  for (const key of Object.keys(localeStrings)) {
    const valueInPlugin = JSON.stringify(localeStrings[key])
    const valueInPack = JSON.stringify(localePack[key])

    if (key in localePack && valueInPlugin !== valueInPack) {
      console.error(`⚠ Plugin ${chalk.magenta(pluginName)} has a duplicate key: ${chalk.magenta(key)}`)
      console.error(`  Value in plugin: ${chalk.cyan(valueInPlugin)}`)
      console.error(`  Value in pack  : ${chalk.yellow(valueInPack)}`)
      console.error()
      throw new Error(`Duplicate locale key: '${key}'`)
    }
    localePack[key] = localeStrings[key] // eslint-disable-line no-param-reassign
  }
}

function checkForUnused (fileContents, pluginName, localePack) {
  const buff = fileContents.join('\n')
  for (const key of Object.keys(localePack)) {
    const regPat = new RegExp(`(i18n|i18nArray)\\([^\\)]*['\`"]${key}['\`"]`, 'g')
    if (!buff.match(regPat)) {
      console.error(`⚠ defaultLocale key: ${chalk.magenta(key)} not used in plugin: ${chalk.cyan(pluginName)}`)
      throw new Error(`Unused locale key: '${key}'`)
    }
  }
}

function sortObjectAlphabetically (obj) {
  return Object.fromEntries(Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)))
}

function createTypeScriptLocale (plugin, pluginName) {
  const allowedStringTypes = Object.keys(plugin.defaultLocale.strings)
    .map(key => `  | '${key}'`)
    .join('\n')

  const pluginClassName = pluginName === 'core' ? 'Core' : plugin.id
  const localePath = path.join(__dirname, '..', 'packages', '@uppy', pluginName, 'types', 'generatedLocale.d.ts')

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

function generateLocaleDocs (plugin, pluginName) {
  const fileName = `${pluginName}.md`
  const docPath = path.join(__dirname, '..', 'website', 'src', 'docs', fileName)

  if (!fs.existsSync(docPath)) {
    console.error(`⚠  Could not find markdown documentation file for "${pluginName}". Make sure the plugin name matches the markdown file name.`)
    return
  }
  if (!plugin.defaultLocale) {
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

async function build () {
  let localePack = {}
  const { plugins, sources } = await buildPluginsList()

  for (const [pluginName, plugin] of Object.entries(plugins)) {
    addLocaleToPack(localePack, plugin, pluginName)
    createTypeScriptLocale(plugin, pluginName)
    generateLocaleDocs(plugin, pluginName)
  }

  localePack = sortObjectAlphabetically(localePack)

  for (const [pluginName, source] of Object.entries(sources)) {
    checkForUnused(source, pluginName, sortObjectAlphabetically(plugins[pluginName].defaultLocale.strings))
  }

  const prettyLocale = stringifyObject(localePack, {
    indent: '  ',
    singleQuotes: true,
    inlineCharacterLimit: 12,
  })

  const localeTemplatePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'template.js')
  const template = fs.readFileSync(localeTemplatePath, 'utf-8')

  const finalLocale = template.replace('en_US.strings = {}', `en_US.strings = ${prettyLocale}`)

  const localePackagePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'src', 'en_US.js')

  const linter = new ESLint({
    fix: true,
  })

  const [lintResult] = await linter.lintText(finalLocale, {
    filePath: localePackagePath,
  })
  fs.writeFileSync(localePackagePath, lintResult.output, 'utf8')

  console.log(`✅ Written '${localePackagePath}'`)
}

function test () {
  const leadingLocaleName = 'en_US'

  const followerLocales = {}
  const followerValues = {}
  const localePackagePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'src', '*.js')
  glob.sync(localePackagePath).forEach((localePath) => {
    const localeName = path.basename(localePath, '.js')

    // Builds array with items like: 'uploadingXFiles'
    // We do not check nested items because different languages may have different amounts of plural forms.
    // eslint-disable-next-line global-require, import/no-dynamic-require
    followerValues[localeName] = require(localePath).strings
    followerLocales[localeName] = Object.keys(followerValues[localeName])
  })

  // Take aside our leading locale: en_US
  const leadingLocale = followerLocales[leadingLocaleName]
  const leadingValues = followerValues[leadingLocaleName]
  delete followerLocales[leadingLocaleName]

  // Compare all follower Locales (RU, DE, etc) with our leader en_US
  const warnings = []
  const fatals = []
  for (const [followerName, followerLocale] of Object.entries(followerLocales)) {
    const missing = leadingLocale.filter((key) => !followerLocale.includes(key))
    const excess = followerLocale.filter((key) => !leadingLocale.includes(key))

    missing.forEach((key) => {
      // Items missing are a non-fatal warning because we don't want CI to bum out over all languages
      // as soon as we add some English
      let value = leadingValues[key]
      if (typeof value === 'object') {
        // For values with plural forms, just take the first one right now
        value = value[Object.keys(value)[0]]
      }
      warnings.push(`${chalk.cyan(followerName)} locale has missing string: '${chalk.red(key)}' that is present in ${chalk.cyan(leadingLocaleName)} with value: ${chalk.yellow(leadingValues[key])}`)
    })
    excess.forEach((key) => {
      // Items in excess are a fatal because we should clean up follower languages once we remove English strings
      fatals.push(`${chalk.cyan(followerName)} locale has excess string: '${chalk.yellow(key)}' that is not present in ${chalk.cyan(leadingLocaleName)}. `)
    })
  }

  if (warnings.length) {
    console.error('--> Locale warnings: ')
    console.error(warnings.join('\n'))
    console.error('')
  }
  if (fatals.length) {
    console.error('--> Locale fatal warnings: ')
    console.error(fatals.join('\n'))
    console.error('')
    process.exit(1)
  }

  if (!warnings.length && !fatals.length) {
    console.log(`--> All locale strings have matching keys ${chalk.green(': )')}`)
    console.log('')
  }
}

async function main () {
  console.warn('\n--> Make sure to run `npm run build:lib` for this locale script to work properly. ')

  const mode = process.argv[2]
  if (mode === 'build') {
    await build()
  } else if (mode === 'test') {
    test()
  } else {
    throw new Error("First argument must be either 'build' or 'test'")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
