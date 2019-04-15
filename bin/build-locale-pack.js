const glob = require('glob')
const Uppy = require('../packages/@uppy/core')
const chalk = require('chalk')
const path = require('path')
const stringifyObject = require('stringify-object')
const fs = require('fs')

console.warn('\n--> Make sure to run `npm run build:lib` for this locale script to work properly\n')

const uppy = Uppy()

// Go over all uppy plugins, check if they are constructors
// and instanciate them, check for defaultLocale property,
// then add to plugins object

function buildPluginsList () {
  const packagesGlobPath = path.join(__dirname, '..', 'packages', '@uppy', '*', 'package.json')
  const files = glob.sync(packagesGlobPath)
  const plugins = {}
  const sources = {}

  for (let file of files) {
    const dirName = path.dirname(file)
    const pluginName = path.basename(dirName)
    const Plugin = require(dirName)
    let plugin

    try {
      plugin = new Plugin(uppy)
    } catch (err) {

    }

    if (plugin && plugin.defaultLocale) {
      const sourcesGlobPath = path.join(__dirname, '..', 'packages', '@uppy', pluginName, 'lib', '**', '*.js')
      plugins[pluginName] = plugin
      sources[pluginName] = glob.sync(sourcesGlobPath).map((file) => {
        return fs.readFileSync(file, 'utf-8')
      })
    }

    // console.log(pluginName)
  }

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
  for (let key in localePack) {
    let match = `i18n('${key}')`
    if (fileContents.join('\n').replace(/i18nArray\('/g, `i18n('`).indexOf(match) === -1) {
      console.error(`Match "${match}" not found in ${pluginName}`)
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

const localePackagePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'en_US.js')
fs.writeFileSync(localePackagePath, finalLocale, 'utf-8')
console.log(`\n✅ Written '${localePackagePath}'\n`)
