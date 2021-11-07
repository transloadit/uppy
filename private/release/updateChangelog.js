#!/usr/bin/env node

import fs from 'node:fs/promises'
import process from 'node:process'

const ROOT = new URL('../../', import.meta.url)

const releases = JSON.parse(await fs.readFile(new URL(process.argv[2], ROOT), 'utf-8'))
const uppyRelease = releases.find(({ ident }) => ident === 'uppy')

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
## ${uppyRelease.newVersion}

Released: ${new Date().toISOString().slice(0, 10)}

| Package | Version | Package | Version |
| - | - | - | - |
${Array.from(makeTable(releases)).join('\n')}

${await fs.readFile(new URL('./CHANGELOG.next.md', ROOT))}${changelogContent.slice(lastReleaseHeadingIndex)}`, lastReleaseHeadingIndex)
await changelog.close()
