#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

// Get the current uppy version
const packageJsonOutput = execSync(
  'yarn workspace uppy exec npm pkg get version',
  { encoding: 'utf8' },
)
const versionMatch = packageJsonOutput.match(/"([0-9]+\.[0-9]+\.[0-9]+)"/)

if (!versionMatch) {
  console.log('Could not extract version from package.json')
  process.exit(1)
}

const version = versionMatch[1]

// Update README.md
const readme = readFileSync('README.md', 'utf8')
const updatedReadme = readme.replace(
  /https:\/\/releases\.transloadit\.com\/uppy\/v[0-9]+\.[0-9]+\.[0-9]+\//g,
  `https://releases.transloadit.com/uppy/v${version}/`,
)

if (readme !== updatedReadme) {
  writeFileSync('README.md', updatedReadme)
  console.log('Updated README.md')
} else {
  console.log('README.md already up to date')
}

// Update BUNDLE-README.md
const bundleReadme = readFileSync('BUNDLE-README.md', 'utf8')
const updatedBundleReadme = bundleReadme.replace(
  /https:\/\/releases\.transloadit\.com\/uppy\/v[0-9]+\.[0-9]+\.[0-9]+\//g,
  `https://releases.transloadit.com/uppy/v${version}/`,
)

if (bundleReadme !== updatedBundleReadme) {
  writeFileSync('BUNDLE-README.md', updatedBundleReadme)
  console.log('Updated BUNDLE-README.md')
} else {
  console.log('BUNDLE-README.md already up to date')
}
