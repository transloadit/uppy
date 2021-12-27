#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { open } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { globby } from 'globby'

const ROOT = new  URL('../../', import.meta.url)
const PACKAGES_FOLDER = new URL('./packages/', ROOT)

const VERSION_URL = /(?<=https:\/\/\S+\/v)\d+\.\d+\.\d+(?:-(?:alpha|beta)(?:[.-]\d+)?)?(?=\/)/g

async function replaceInFile (filename, replacements) {
  const file = await open(filename, 'r+')
  let content = await file.readFile('utf8')

  let hasBeenModified = false
  let exec
  while (exec = VERSION_URL.exec(content)) {
    // eslint-disable-next-line no-loop-func
    const pkg = Object.keys(replacements).find(pkgName => content.slice(exec.index - pkgName.length, exec.index) === pkgName)
    if (pkg && exec[0] !== replacements[pkg]) {
      hasBeenModified = true
      content = content.slice(0, exec.index) + replacements[pkg] + content.slice(VERSION_URL.lastIndex)
    }
  }

  if (hasBeenModified) {
    const { bytesWritten } = await file.write(content, 0, 'utf8')
    await file.truncate(bytesWritten)
    console.log(filename)
  }

  await file.close()
}

async function updateVersions (files, packageNames) {
  const replacements = Object.fromEntries(packageNames.map(packageName => {
    const { version } = JSON.parse(readFileSync(new URL(`./${packageName}/package.json`, PACKAGES_FOLDER), 'utf8'))
    // uppy → /uppy/v
    // @uppy/robodog → /uppy/robodog/v
    const urlPart = `/${packageName.replace(/^@/, '')}/v`
    return [urlPart, version]
  }))

  await Promise.all(files.map(f => replaceInFile(f, replacements)))
}

const files = await globby([
  'README.md',
  'BUNDLE-README.md',
  'examples/**/*.html',
  'packages/*/README.md',
  'packages/@uppy/*/README.md',
  'website/src/docs/**',
  'website/src/examples/**',
  'website/themes/uppy/layout/**',
  '!**/node_modules/**',
], {
  gitignore: true,
  onlyFiles: true,
  cwd: fileURLToPath(ROOT),
  absolute: true,
})

await updateVersions(files, [
  'uppy',
  '@uppy/robodog',
  '@uppy/locales',
])
