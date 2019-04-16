const glob = require('glob')
const Uppy = require('../packages/@uppy/core')
const chalk = require('chalk')
const path = require('path')
const stringifyObject = require('stringify-object')
const fs = require('fs')

console.warn('\n--> Make sure to run `npm run build:lib` for this locale script to work properly. ')

const uppy = Uppy()

// Go over all uppy plugins, check if they are constructors
// and instanciate them, check for defaultLocale property,
// then add to plugins object

function getSources (pluginName) {
  const dependencies = {
    // because e.g. 'companionAuthError' is used in provider-views but set in Core's defaultLocale
    'core': ['provider-views'],
    // because e.g. 'emptyFolderAdded' is used in provider-views but set in Dashboard's defaultLocale
    'dashboard': ['provider-views']
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
  const packagesGlobPath = path.join(__dirname, '..', 'packages', '@uppy', '*', 'package.json')
  const files = glob.sync(packagesGlobPath)
  const plugins = {}
  const sources = {}

  console.log(`--> Checked plugins could be instantiated and have defaultLocale in them:\n`)
  for (let file of files) {
    const dirName = path.dirname(file)
    const pluginName = path.basename(dirName)
    if (pluginName === 'locales') {
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
      key: () => {},
      getItem: () => {}
    }
    global.window = {
      indexedDB: {
        open: () => { return {} }
      }
    }
    global.document = {
      createElement: () => {
        return { style: { } }
      }
    }

    try {
      if (pluginName === 'provider-views') {
        plugin = new Plugin(plugins['drag-drop'], {
          serverPattern: '',
          serverUrl: 'https://companion.uppy.io'
        })
      } else if (pluginName === 'store-redux') {
        plugin = new Plugin({ store: { dispatch: () => {} } })
      } else {
        plugin = new Plugin(uppy, {
          serverPattern: '',
          serverUrl: 'https://companion.uppy.io',
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

  console.log(``)

  return { plugins, sources }
}

function addLocaleToPack (plugin, pluginName) {
  const localeStrings = plugin.defaultLocale.strings

  for (let key in localeStrings) {
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
  let buff = fileContents.join('\n')
  for (let key in localePack) {
    let regPat = new RegExp(`(i18n|i18nArray)\\([^\\)]*['\`"]${key}['\`"]`, 'g')
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

const { plugins, sources } = buildPluginsList()
let localePack = {}

for (let pluginName in plugins) {
  addLocaleToPack(plugins[pluginName], pluginName)
}

localePack = sortObjectAlphabetically(localePack)

for (let pluginName in sources) {
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
