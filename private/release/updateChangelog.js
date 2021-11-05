#!/usr/bin/env node

import fs from 'node:fs/promises'
import process from 'node:process'

const releases = JSON.parse(await fs.readFile(process.argv[2], 'utf-8'))
const uppyRelease = releases.find(({ ident }) => ident === 'uppy')

const ROOT = new URL('../../', import.meta.url)
const changelog = await fs.open(new URL('./CHANGELOG.md', ROOT), 'r+')

const changelogContent = await changelog.readFile()

const lastReleaseHeadingIndex = changelogContent.indexOf('\n## ')

function* makeTable (versions) {
  const mid = Math.ceil(versions.length / 2)
  for (let i = 0; i < mid; i++) {
    const left = versions[i] || { ident: '-', newVersion: '-' }
    const right = versions[i + mid] || { ident: '-', newVersion: '-' }
    yield `| ${left.ident} | ${left.newVersion} | ${right.ident} | ${right.newVersion} |`
  }
}

await changelog.write(`
## ${uppyRelease.version}

Released: ${new Date().toISOString().slice(0, 10)}

| Package | Version | Package | Version |
| - | - | - | - |
`, lastReleaseHeadingIndex)
await changelog.write(makeTable(releases))
await changelog.write(fs.readFile(new URL('./CHANGELOG.next.md', ROOT)))
await changelog.write(changelogContent.slice(lastReleaseHeadingIndex))
await changelog.close()
