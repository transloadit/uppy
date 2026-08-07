/* eslint-disable no-console, prefer-arrow-callback */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { globSync } from 'glob'

import {
  getLocales,
  getPaths,
  localeNameFromLocalePath,
  omit,
} from './helpers.mjs'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const leadingLocaleName = 'en_US'
const mode = process.argv[2]
const verbose = process.argv.includes('--verbose')
const pluginLocaleDependencies = {
  core: ['provider-views', 'companion-client'],
}

function getAllFilesPerPlugin(pluginNames) {
  const filesPerPlugin = {}

  function getFiles(name) {
    return globSync(`${root}/packages/@uppy/${name}/lib/**/*.js`)
      .filter((filePath) => !filePath.includes('locale.js'))
      .map((filePath) => fs.readFileSync(filePath, 'utf-8'))
  }

  for (const name of pluginNames) {
    filesPerPlugin[name] = getFiles(name)

    if (name in pluginLocaleDependencies) {
      for (const subDeb of pluginLocaleDependencies[name]) {
        filesPerPlugin[name].push(...getFiles(subDeb))
      }
    }
  }

  return filesPerPlugin
}

async function unused(filesPerPlugin, data) {
  for (const [name, fileStrings] of Object.entries(filesPerPlugin)) {
    const fileString = fileStrings.join('\n')
    const localePath = path.join(
      root,
      'packages',
      '@uppy',
      name,
      'src',
      'locale.js',
    )
    const locale = (await import(localePath)).default

    for (const key of Object.keys(locale.strings)) {
      const regPat = new RegExp(
        `(i18n|i18nArray)\\([^\\)]*['\`"]${key}['\`"]`,
        'g',
      )
      if (!fileString.match(regPat)) {
        return Promise.reject(
          new Error(`Unused locale key "${key}" in @uppy/${name}`),
        )
      }
    }
  }

  return data
}

// Locales are community-contributed and always lag behind `en_US`, so
// discrepancies are expected and this mode is advisory: it reports, it never
// fails the build. Pass `--verbose` for the per-key breakdown; the default is a
// one-line-per-locale summary so it stays readable in CI.
function warnings({ leadingLocale, followerLocales }) {
  if (leadingLocale == null) {
    throw new Error(
      `Leading locale "${leadingLocaleName}" not found. Run \`yarn build\` first — this check reads the compiled locales from lib/.`,
    )
  }

  const leadingStrings = leadingLocale.strings
  const total = Object.keys(leadingStrings).length
  const entries = Object.entries(followerLocales).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  const details = []
  const summary = []
  let missingTotal = 0
  let excessTotal = 0

  for (const [name, locale] of entries) {
    const strings = locale.strings
    const missing = Object.keys(leadingStrings).filter(
      (key) => !(key in strings),
    )
    const excess = Object.keys(strings).filter(
      (key) => !(key in leadingStrings),
    )

    missingTotal += missing.length
    excessTotal += excess.length

    summary.push(
      [
        chalk.cyan(name.padEnd(16)),
        `${String(missing.length).padStart(3)} missing`,
        `${String(excess.length).padStart(3)} excess`,
        `(of ${total} keys in ${leadingLocaleName})`,
      ].join('  '),
    )

    details.push('')
    details.push(`--> Keys from ${leadingLocaleName} missing in ${name}`)
    details.push('')

    for (const key of missing) {
      let value = leadingStrings[key]

      if (typeof value === 'object') {
        // For values with plural forms, just take the first one right now
        value = value[Object.keys(value)[0]]
      }

      details.push(
        [
          `${chalk.cyan(name)} locale has missing string: '${chalk.red(key)}'`,
          `that is present in ${chalk.cyan(leadingLocaleName)}`,
          `with value: ${chalk.yellow(value)}`,
        ].join(' '),
      )
    }

    details.push('')
    details.push(`--> Keys from ${name} missing in ${leadingLocaleName}`)
    details.push('')

    for (const key of excess) {
      details.push(
        [
          `${chalk.cyan(name)} locale has excess string:`,
          `'${chalk.yellow(key)}' that is not present`,
          `in ${chalk.cyan(leadingLocaleName)}.`,
        ].join(' '),
      )
    }
  }

  if (verbose) {
    console.log(details.join('\n'))
    console.log('')
  }

  console.log(`--> Locale coverage relative to ${leadingLocaleName}\n`)
  console.log(summary.join('\n'))
  console.log(
    `\n${chalk.bold(`${entries.length} locales`)}: ${chalk.red(
      `${missingTotal} missing`,
    )}, ${chalk.yellow(`${excessTotal} excess`)} string(s) in total.`,
  )

  if (!verbose && missingTotal + excessTotal > 0) {
    console.log(
      chalk.dim(
        'Re-run with --verbose to list the individual keys. This check is advisory and does not fail the build.',
      ),
    )
  }
}

function test() {
  switch (mode) {
    case 'unused':
      return getPaths(`${root}/packages/@uppy/**/src/locale.js`).then((paths) =>
        unused(
          getAllFilesPerPlugin(
            paths.map((filePath) =>
              path.basename(path.join(filePath, '..', '..')),
            ),
          ),
        ),
      )

    case 'warnings':
      // Node cannot `import()` the TypeScript sources in `src/`, so we read the
      // compiled output instead. This means `yarn build` has to have run first
      // (the `unused` mode already relies on `lib/` for the same reason).
      return getLocales(
        `${root}/packages/@uppy/locales/lib/*.js`,
        localeNameFromLocalePath,
      ).then((locales) =>
        warnings({
          leadingLocale: locales[leadingLocaleName],
          followerLocales: omit(locales, leadingLocaleName),
        }),
      )

    default:
      return Promise.reject(new Error(`Invalid mode "${mode}"`))
  }
}

await test()
