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
// Node strips types when importing `.ts`, so the modes that compare language
// packs read `src/` and stay independent of `yarn build`. (`unused` still needs
// `lib/`, but of the *plugin* packages, to scan their compiled code for i18n calls.)
const localePackGlob = `${root}/packages/@uppy/locales/src/*.ts`
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

// @uppy/core's Translator interpolates by building `new RegExp('%\\{' + arg + '\\}')`
// from the option name, so only the exact `%{name}` form is ever substituted.
const placeholderPattern = /%\{(\w+)\}/g

/**
 * Anything that looks like a placeholder but isn't the exact `%{name}` form:
 * `% {name}`, `%{ name }`, `%{name` and `{name}` all render verbatim.
 * Only meaningful for a `name` we already know is not present in its exact form.
 */
function findMalformedPlaceholder(string, name) {
  const [match] = string.match(new RegExp(`%?\\s*\\{\\s*${name}\\s*\\}?`)) ?? []
  return match
}

function getPlaceholders(string) {
  return new Set(
    Array.from(string.matchAll(placeholderPattern), ([, name]) => name),
  )
}

/**
 * A locale value is either a string, or an object of plural forms keyed by the
 * indices the locale's `pluralize` returns. Normalize both into `[form, string]`
 * pairs so every form gets checked.
 */
function getForms(value) {
  if (typeof value === 'string') return [[null, value]]
  return Object.entries(value)
}

// Unlike `warnings`, this mode does fail the build: a placeholder that cannot
// interpolate is never an intentional translation choice, it is a typo that
// renders raw `%{...}` to users. Diverging placeholder *sets* are advisory,
// since a translation may legitimately spell a number out instead.
function placeholders({ leadingLocale, followerLocales }) {
  const errors = []
  const logs = []

  for (const [name, locale] of Object.entries(followerLocales)) {
    for (const [key, value] of Object.entries(locale.strings)) {
      const leadingValue = leadingLocale.strings[key]
      // Excess keys are already reported by the `warnings` mode.
      if (leadingValue == null) continue

      const expected = new Set(
        getForms(leadingValue).flatMap(([, string]) => [
          ...getPlaceholders(string),
        ]),
      )

      for (const [form, string] of getForms(value)) {
        const where = [
          chalk.cyan(name),
          `→ ${chalk.yellow(key)}${form == null ? '' : `['${form}']`}`,
        ].join(' ')
        const found = getPlaceholders(string)

        for (const placeholder of expected) {
          if (found.has(placeholder)) continue

          const malformed = findMalformedPlaceholder(string, placeholder)
          if (malformed) {
            errors.push(
              [
                `${where}: malformed placeholder ${chalk.red(malformed)},`,
                `expected ${chalk.green(`%{${placeholder}}`)}.`,
                `It will not interpolate and is rendered as-is:\n    ${string}`,
              ].join(' '),
            )
          } else {
            logs.push(
              [
                `${where}: missing placeholder ${chalk.red(`%{${placeholder}}`)}`,
                `that ${chalk.cyan(leadingLocaleName)} has:\n    ${string}`,
              ].join(' '),
            )
          }
        }

        for (const placeholder of found) {
          if (expected.has(placeholder)) continue

          logs.push(
            [
              `${where}: unknown placeholder ${chalk.red(`%{${placeholder}}`)}`,
              `that ${chalk.cyan(leadingLocaleName)} does not have,`,
              `so no value is passed for it and it is rendered as-is:\n    ${string}`,
            ].join(' '),
          )
        }
      }
    }
  }

  if (logs.length) {
    console.log(logs.join('\n'))
    console.log(`\n${chalk.yellow(`${logs.length} placeholder warning(s).`)}`)
  }

  if (errors.length) {
    return Promise.reject(
      new Error(
        `\n${errors.join('\n')}\n\n${errors.length} malformed placeholder(s).`,
      ),
    )
  }

  return undefined
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
      return getLocales(localePackGlob, localeNameFromLocalePath).then(
        (locales) =>
          warnings({
            leadingLocale: locales[leadingLocaleName],
            followerLocales: omit(locales, leadingLocaleName),
          }),
      )

    case 'placeholders':
      return getLocales(localePackGlob, localeNameFromLocalePath).then(
        (locales) =>
          placeholders({
            leadingLocale: locales[leadingLocaleName],
            followerLocales: omit(locales, leadingLocaleName),
          }),
      )

    default:
      return Promise.reject(new Error(`Invalid mode "${mode}"`))
  }
}

await test()
