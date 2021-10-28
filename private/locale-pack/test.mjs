/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import fs from 'node:fs'

import glob from 'glob'
import chalk from 'chalk'

import { getPaths, omit } from './helpers.mjs'

const root = path.join('..', '..')
const leadingLocaleName = 'en_US'
const mode = process.argv[2]
const pluginLocaleDependencies = {
  core: 'provider-views',
}

test()
  .then(() => {
    console.log('\n')
    console.log('No blocking issues found')
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

function test () {
  switch (mode) {
    case 'unused':
      return getPaths(`${root}/packages/@uppy/**/src/locale.js`)
        .then((paths) => paths.map((filePath) => path.basename(path.join(filePath, '..', '..'))))
        .then(getAllFilesPerPlugin)
        .then(unused)

    case 'warnings':
      return getPaths(`${root}/packages/@uppy/locales/src/*.js`)
        .then(importFiles)
        .then((locales) => ({
          leadingLocale: locales[leadingLocaleName],
          followerLocales: omit(locales, leadingLocaleName),
        }))
        .then(warnings)

    default:
      return Promise.reject(new Error(`Invalid mode "${mode}"`))
  }
}

async function importFiles (paths) {
  const locales = {}

  for (const filePath of paths) {
    const localeName = path.basename(filePath, '.js')
    // Note: `.default` should be removed when we move to ESM
    const locale = (await import(filePath)).default

    locales[localeName] = locale.strings
  }

  return locales
}

function getAllFilesPerPlugin (pluginNames) {
  const filesPerPlugin = {}

  function getFiles (name) {
    return glob
      .sync(`${root}/packages/@uppy/${name}/lib/**/*.js`)
      .filter((filePath) => !filePath.includes('locale.js'))
      .map((filePath) => fs.readFileSync(filePath, 'utf-8'))
  }

  for (const name of pluginNames) {
    filesPerPlugin[name] = getFiles(name)

    if (name in pluginLocaleDependencies) {
      filesPerPlugin[name] = filesPerPlugin[name].concat(
        getFiles(pluginLocaleDependencies[name])
      )
    }
  }

  return filesPerPlugin
}

async function unused (filesPerPlugin, data) {
  for (const [name, fileStrings] of Object.entries(filesPerPlugin)) {
    const fileString = fileStrings.join('\n')
    const localePath = path.join(
      root,
      'packages',
      '@uppy',
      name,
      'src',
      'locale.js'
    )
    const locale = (await import(localePath)).default

    for (const key of Object.keys(locale.strings)) {
      const regPat = new RegExp(
        `(i18n|i18nArray)\\([^\\)]*['\`"]${key}['\`"]`,
        'g'
      )
      if (!fileString.match(regPat)) {
        return Promise.reject(new Error(`Unused locale key "${key}" in @uppy/${name}`))
      }
    }
  }

  return data
}

function warnings ({ leadingLocale, followerLocales }) {
  const entries = Object.entries(followerLocales)
  const logs = []

  for (const [name, locale] of entries) {
    const missing = Object.keys(leadingLocale).filter((key) => !(key in locale))
    const excess = Object.keys(locale).filter((key) => !(key in leadingLocale))

    logs.push('\n')
    logs.push(`--> Keys from ${leadingLocaleName} missing in ${name}`)
    logs.push('\n')

    for (const key of missing) {
      let value = leadingLocale[key]

      if (typeof value === 'object') {
        // For values with plural forms, just take the first one right now
        value = value[Object.keys(value)[0]]
      }

      logs.push(
        [
          `${chalk.cyan(name)} locale has missing string: '${chalk.red(key)}'`,
          `that is present in ${chalk.cyan(leadingLocaleName)}`,
          `with value: ${chalk.yellow(value)}`,
        ].join(' ')
      )
    }

    logs.push('\n')
    logs.push(`--> Keys from ${name} missing in ${leadingLocaleName}`)
    logs.push('\n')

    for (const key of excess) {
      logs.push(
        [
          `${chalk.cyan(name)} locale has excess string:`,
          `'${chalk.yellow(key)}' that is not present`,
          `in ${chalk.cyan(leadingLocaleName)}.`,
        ].join(' ')
      )
    }
  }

  console.log(logs.join('\n'))
}
