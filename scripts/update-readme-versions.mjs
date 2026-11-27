#!/usr/bin/env node

// Keeps the CDN URLs in READMEs, docs and examples pointing at the current
// release. Migration guides and blog posts are left alone on purpose: their
// old versions are part of the history they describe.

import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)

function readVersion(packageJsonPath) {
  const { version } = JSON.parse(
    readFileSync(new URL(packageJsonPath, root), 'utf8'),
  )
  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) {
    console.log(
      `${packageJsonPath} has a prerelease version (${version}), leaving CDN URLs as they are`,
    )
    process.exit(0)
  }
  return version
}

const version = readVersion('packages/uppy/package.json')
const localesVersion = readVersion('packages/@uppy/locales/package.json')

const semver = String.raw`[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.]+)?`
const uppyUrl = new RegExp(
  String.raw`https://releases\.transloadit\.com/uppy/v${semver}/`,
  'g',
)
const localesUrl = new RegExp(
  String.raw`https://releases\.transloadit\.com/uppy/locales/v${semver}/`,
  'g',
)

const files = [
  'README.md',
  'BUNDLE-README.md',
  'examples/cdn/index.html',
  'examples/companion/client/index.html',
  'examples/aws-nodejs/index.ts',
  'website/docs/locales.mdx',
]

for (const file of files) {
  const content = readFileSync(new URL(file, root), 'utf8')
  const updated = content
    .replace(uppyUrl, `https://releases.transloadit.com/uppy/v${version}/`)
    .replace(
      localesUrl,
      `https://releases.transloadit.com/uppy/locales/v${localesVersion}/`,
    )

  if (content !== updated) {
    writeFileSync(new URL(file, root), updated)
    console.log(`Updated ${file}`)
  } else {
    console.log(`${file} already up to date`)
  }
}
