/* eslint-disable no-console, prefer-arrow-callback */
import path from 'node:path'
import fs from 'node:fs'

import glob from 'glob'
import chalk from 'chalk'
import Task from 'data.task'

import { getPaths, omit } from './locale-packs.helpers.mjs'

const leadingLocaleName = 'en_US'
const mode = process.argv[2]
const pluginLocaleDependencies = {
  core: 'provider-views',
}

test().fork(
  function onError (error) {
    console.error(error)
    process.exit(1)
  },
  function onSuccess () {
    console.log('\n')
    console.log('No blocking issues found')
  }
)

function test () {
  switch (mode) {
    case 'unused':
      return getPaths('packages/@uppy/**/src/locale.js')
        .map((paths) => paths.map((filePath) => path.basename(path.join(filePath, '..', '..'))))
        .map(getAllFilesPerPlugin)
        .chain(unused)

    case 'warnings':
      return getPaths('packages/@uppy/locales/src/*.js')
        .chain(importFiles)
        .map((locales) => ({
          leadingLocale: locales[leadingLocaleName],
          followerLocales: omit(locales, leadingLocaleName),
        }))
        .map(warnings)

    default:
      return new Task().rejected(`Invalid mode "${mode}"`)
  }
}

function importFiles (paths) {
  return new Task(async (_, resolve) => {
    const locales = {}

    for (const filePath of paths) {
      const localeName = path.basename(filePath, '.js')
      // Note: `.default` should be removed when we move to ESM
      const locale = (await import(path.join('..', filePath))).default

      locales[localeName] = locale.strings
    }

    resolve(locales)
  })
}

function getAllFilesPerPlugin (pluginNames) {
  const filesPerPlugin = {}

  function getFiles (name) {
    return glob
      .sync(`packages/@uppy/${name}/lib/**/*.js`)
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

function unused (filesPerPlugin, data) {
  return new Task(async (reject, resolve) => {
    for (const [name, fileStrings] of Object.entries(filesPerPlugin)) {
      const fileString = fileStrings.join('\n')
      const localePath = path.join(
        '..',
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
          reject(`Unused locale key "${key}" in @uppy/${name}`)
        }
      }
    }

    resolve(data)
  })
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
