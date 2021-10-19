const glob = require('glob')
const chalk = require('chalk')
const path = require('path')

const leadingLocaleName = 'en_US'

const followerLocales = {}
const followerValues = {}
const localePackagePath = path.join(
  __dirname,
  '..',
  'packages',
  '@uppy',
  'locales',
  'src',
  '*.js'
)
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
    warnings.push(
      `${chalk.cyan(followerName)} locale has missing string: '${chalk.red(
        key
      )}' that is present in ${chalk.cyan(
        leadingLocaleName
      )} with value: ${chalk.yellow(leadingValues[key])}`
    )
  })
  excess.forEach((key) => {
    // Items in excess are a fatal because we should clean up follower languages once we remove English strings
    fatals.push(
      `${chalk.cyan(followerName)} locale has excess string: '${chalk.yellow(
        key
      )}' that is not present in ${chalk.cyan(leadingLocaleName)}. `
    )
  })
}

// function checkForUnused (fileContents, pluginName, localePack) {
//   const buff = fileContents.join('\n')
//   for (const key of Object.keys(localePack)) {
//     const regPat = new RegExp(`(i18n|i18nArray)\\([^\\)]*['\`"]${key}['\`"]`, 'g')
//     if (!buff.match(regPat)) {
//       console.error(`⚠ defaultLocale key: ${chalk.magenta(key)} not used in plugin: ${chalk.cyan(pluginName)}`)
//       throw new Error(`Unused locale key: '${key}'`)
//     }
//   }
// }

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
