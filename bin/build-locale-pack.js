/* eslint-disable */
const glob = require('glob')
const Dashboard = require('../packages/@uppy/dashboard')
const StatusBar = require('../packages/@uppy/status-bar')
const Uppy = require('../packages/@uppy/core')
const chalk = require('chalk')
const path = require('path')

const uppy = Uppy()

const plugins = {}
const packagesGlobPath = path.join(__dirname, '..', 'packages', '@uppy', '*', 'package.json')
glob(packagesGlobPath, (er, files) => {
  files.forEach((file) => {
    const dirName = path.dirname(file)
    const pluginName = path.basename(dirName)

    try {
      const Plugin = require(dirName)
      const plugin = new Plugin(uppy)
      // console.log(Plugin)
      if (plugin.defaultLocale) {
        plugins[pluginName] = plugin
      }
    } catch (err) {

    }

    // console.log(pluginName)
  })
  console.log(plugins)
  process.exit()
})

return

// es-lint ignore //

const DashboardLocale = new Dashboard(uppy)
const StatusBarLocale = new StatusBar(uppy)

const localePack = {}

function addLocaleToPack (plugin) {
  const localeStrings = plugin.defaultLocale.strings

  Object.keys(localeStrings).forEach((key) => {
    const valueInPlugin = JSON.stringify(localeStrings[key])
    const valueInPack = JSON.stringify(localePack[key])

    if (key in localePack && valueInPlugin !== valueInPack) {
      console.error(`Plugin ${chalk.magenta(plugin.id || 'Core')} has a duplicate key: ${chalk.magenta(key)}`)
      console.error(`Value in plugin: ${chalk.cyan(valueInPlugin)}`)
      console.error(`Value in pack  : ${chalk.yellow(valueInPack)}`)
      console.log()
    }
    localePack[key] = localeStrings[key]
  })
}

addLocaleToPack(DashboardLocale)
addLocaleToPack(StatusBarLocale)
addLocaleToPack(uppy)

// console.log(localePack)
