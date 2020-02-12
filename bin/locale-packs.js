const glob = require('glob')
const Uppy = require('../packages/@uppy/core')
const chalk = require('chalk')
const path = require('path')
const flat = require('flat')
const stringifyObject = require('stringify-object')
const fs = require('fs')
const uppy = Uppy()
let localePack = {}
const plugins = {}
const sources = {}

console.warn('\n--> Make sure to run `npm run build:lib` for this locale script to work properly. ')

const mode = process.argv[2]
if (mode === 'build') {
  build()
} else if (mode === 'test') {
  test()
} else {
  throw new Error("First argument must be either 'build' or 'test'")
}

function getSources (pluginName) {
  const dependencies = {
    // because 'provider-views' doesn't have its own locale, it uses Core's defaultLocale
    core: ['provider-views']
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

function buildPluginsList () {
  // Go over all uppy plugins, check if they are constructors
  // and instanciate them, check for defaultLocale property,
  // then add to plugins object

  const packagesGlobPath = path.join(__dirname, '..', 'packages', '@uppy', '*', 'package.json')
  const files = glob.sync(packagesGlobPath)

  console.log('--> Checked plugins could be instantiated and have defaultLocale in them:\n')
  for (const file of files) {
    const dirName = path.dirname(file)
    const pluginName = path.basename(dirName)
    if (pluginName === 'locales' || pluginName === 'react-native') {
      continue
    }
    const Plugin = require(dirName)
    let plugin

    // A few hacks to emulate browser environment because e.g.:
    // GoldenRetrieves calls upon MetaDataStore in the constructor, which uses localStorage
    // @TODO Consider rewriting constructors so they don't make imperative calls that rely on
    // browser environment (OR: just keep this browser mocking, if it's only causing issues for this script, it doesn't matter)
    global.location = { protocol: 'https' }
    global.navigator = {}
    global.localStorage = {
      key: () => { },
      getItem: () => { }
    }
    global.window = {
      indexedDB: {
        open: () => { return {} }
      }
    }
    global.document = {
      createElement: () => {
        return { style: {} }
      }
    }

    try {
      if (pluginName === 'provider-views') {
        plugin = new Plugin(plugins['drag-drop'], {
          companionPattern: '',
          companionUrl: 'https://companion.uppy.io'
        })
      } else if (pluginName === 'store-redux') {
        plugin = new Plugin({ store: { dispatch: () => { } } })
      } else {
        plugin = new Plugin(uppy, {
          companionPattern: '',
          companionUrl: 'https://companion.uppy.io',
          params: {
            auth: {
              key: 'x'
            }
          }
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

  console.log('')

  return { plugins, sources }
}

function addLocaleToPack (plugin, pluginName) {
  const localeStrings = plugin.defaultLocale.strings

  for (const key in localeStrings) {
    const valueInPlugin = JSON.stringify(localeStrings[key])
    const valueInPack = JSON.stringify(localePack[key])

    if (key in localePack && valueInPlugin !== valueInPack) {
      console.error(`⚠ Plugin ${chalk.magenta(pluginName)} has a duplicate key: ${chalk.magenta(key)}`)
      console.error(`  Value in plugin: ${chalk.cyan(valueInPlugin)}`)
      console.error(`  Value in pack  : ${chalk.yellow(valueInPack)}`)
      console.error()
    }
    localePack[key] = localeStrings[key]
  }
}

function checkForUnused (fileContents, pluginName, localePack) {
  const buff = fileContents.join('\n')
  for (const key in localePack) {
    const regPat = new RegExp(`(i18n|i18nArray)\\([^\\)]*['\`"]${key}['\`"]`, 'g')
    if (!buff.match(regPat)) {
      console.error(`⚠ defaultLocale key: ${chalk.magenta(key)} not used in plugin: ${chalk.cyan(pluginName)}`)
    }
  }
}

function sortObjectAlphabetically (obj, sortFunc) {
  return Object.keys(obj).sort(sortFunc).reduce(function (result, key) {
    result[key] = obj[key]
    return result
  }, {})
}

function createTypeScriptLocale (plugin, pluginName) {
  const allowedStringTypes = Object.keys(plugin.defaultLocale.strings)
    .map(key => `  | '${key}'`)
    .join('\n')

  const pluginClassName = pluginName === 'core' ? 'Core' : plugin.id
  const localePath = path.join(__dirname, '..', 'packages', '@uppy', pluginName, 'types', 'generatedLocale.d.ts')

  const localeTypes =
    'import Uppy = require(\'@uppy/core\')\n' +
    '\n' +
    `type ${pluginClassName}Locale = Uppy.Locale` + '<\n' +
    allowedStringTypes + '\n' +
    '>\n' +
    '\n' +
    `export = ${pluginClassName}Locale\n`

  fs.writeFileSync(localePath, localeTypes)
}

function build () {
  const { plugins, sources } = buildPluginsList()

  for (const pluginName in plugins) {
    addLocaleToPack(plugins[pluginName], pluginName)
  }

  for (const pluginName in plugins) {
    createTypeScriptLocale(plugins[pluginName], pluginName)
  }

  localePack = sortObjectAlphabetically(localePack)

  for (const pluginName in sources) {
    checkForUnused(sources[pluginName], pluginName, sortObjectAlphabetically(plugins[pluginName].defaultLocale.strings))
  }

  const prettyLocale = stringifyObject(localePack, {
    indent: '  ',
    singleQuotes: true,
    inlineCharacterLimit: 12
  })

  const localeTemplatePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'template.js')
  const template = fs.readFileSync(localeTemplatePath, 'utf-8')

  const finalLocale = template.replace('en_US.strings = {}', 'en_US.strings = ' + prettyLocale)

  const localePackagePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'src', 'en_US.js')
  fs.writeFileSync(localePackagePath, finalLocale, 'utf-8')
  console.log(`✅ Written '${localePackagePath}'`)
}

function test () {
  const leadingLocaleName = 'en_US'

  const followerLocales = {}
  const followerValues = {}
  const localePackagePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'src', '*.js')
  glob.sync(localePackagePath).forEach((localePath) => {
    const localeName = path.basename(localePath, '.js')
    // we renamed the es_GL → gl_ES locale, and kept the old name
    // for backwards-compat, see https://github.com/transloadit/uppy/pull/1929
    if (localeName === 'es_GL') return

    // Builds array with items like: 'uploadingXFiles.2'
    followerValues[localeName] = flat(require(localePath).strings)
    followerLocales[localeName] = Object.keys(followerValues[localeName])
  })

  // Take aside our leading locale: en_US
  const leadingLocale = followerLocales[leadingLocaleName]
  const leadingValues = followerValues[leadingLocaleName]
  delete followerLocales[leadingLocaleName]

  // Compare all follower Locales (RU, DE, etc) with our leader en_US
  const warnings = []
  const fatals = []
  for (const followerName in followerLocales) {
    const followerLocale = followerLocales[followerName]
    const missing = leadingLocale.filter((key) => !followerLocale.includes(key))
    const excess = followerLocale.filter((key) => !leadingLocale.includes(key))

    missing.forEach((key) => {
      // Items missing are a non-fatal warning because we don't want CI to bum out over all languages
      // as soon as we add some English
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
