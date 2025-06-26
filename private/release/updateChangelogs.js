#!/usr/bin/env node

import { Buffer } from 'node:buffer'
import { createReadStream, promises as fs } from 'node:fs'
import process from 'node:process'
import { createInterface } from 'node:readline'

const ROOT = new URL('../../', import.meta.url)
const PACKAGES_FOLDER = new URL('./packages/', ROOT)

const releasedDate = new Date().toISOString().slice(0, 10)

const releases = JSON.parse(
  await fs.readFile(new URL(process.argv[2], ROOT), 'utf-8'),
)
const uppyRelease = releases.find(({ ident }) => ident === 'uppy')

const changelog = await fs.open(new URL('./CHANGELOG.md', ROOT), 'r+')

const changelogContent = await changelog.readFile()

const mostRecentReleaseHeading = changelogContent.indexOf('\n## ')

function* makeTable(versions) {
  const pkgNameMaxLength = Math.max(
    'Package'.length,
    ...versions.map((pkg) => pkg.ident.length),
  )
  const pkgVersionMaxLength = Math.max(
    'Version'.length,
    ...versions.map((pkg) => pkg.newVersion.length),
  )
  const makeRow = (...cells) =>
    `| ${cells.map((cell, i) => cell[i % 2 ? 'padStart' : 'padEnd'](i % 2 ? pkgVersionMaxLength : pkgNameMaxLength)).join(' | ')} |`

  yield makeRow('Package', 'Version', 'Package', 'Version')
  yield makeRow(
    ...Array.from({ length: 4 }, (_, i) =>
      '-'.repeat(i % 2 ? pkgVersionMaxLength : pkgNameMaxLength),
    ),
  )

  const mid = Math.ceil(versions.length / 2)
  for (let i = 0; i < mid; i++) {
    const left = versions[i] || { ident: '', newVersion: '' }
    const right = versions[i + mid] || { ident: '', newVersion: '' }
    yield makeRow(left.ident, left.newVersion, right.ident, right.newVersion)
  }
}

/**
 * Opens the changelog of a given package, creating it if it doesn't exist.
 *
 * @param {string} pkg Package name
 * @returns {Promise<fs.FileHandle>}
 */
async function updateSubPackageChangelog(pkg, lines, subsetOfLines) {
  const packageReleaseInfo = releases.find(({ ident }) => ident === pkg)
  if (packageReleaseInfo == null) {
    console.warn(pkg, 'is not being released')
    return null
  }
  const { newVersion } = packageReleaseInfo
  const url = new URL(`./${pkg}/CHANGELOG.md`, PACKAGES_FOLDER)
  const heading = Buffer.from(`# ${pkg}\n`)
  let fh
  let oldContent
  try {
    fh = await fs.open(url, 'r+') // this will throw if the file doesn't exist
    oldContent = await fh.readFile()
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
    // Creates the file if it doesn't exist yet.
    fh = await fs.open(url, 'wx')
    await fh.writeFile(heading)
  }
  const { bytesWritten } = await fh.write(
    `
## ${newVersion}

Released: ${releasedDate}
Included in: Uppy v${uppyRelease.newVersion}

${subsetOfLines.map((index) => lines[index]).join('\n')}
`,
    heading.byteLength,
  )
  if (oldContent != null) {
    await fh.write(
      oldContent,
      heading.byteLength,
      undefined,
      bytesWritten + heading.byteLength,
    )
  }
  console.log(`packages/${pkg}/CHANGELOG.md`) // outputing the relative path of the file to git add it.
  return fh.close()
}

const subPackagesChangelogs = {}
const lines = []
for await (const line of createInterface({
  input: createReadStream(new URL('./CHANGELOG.next.md', ROOT)),
})) {
  const index = lines.push(line) - 1
  for (const pkg of line.slice(2, line.indexOf(':')).split(',')) {
    subPackagesChangelogs[pkg] ??= []
    subPackagesChangelogs[pkg].push(index)
  }
}

await changelog.write(
  `
## ${uppyRelease.newVersion}

Released: ${releasedDate}

${Array.from(makeTable(releases)).join('\n')}

${lines.join('\n')}

${changelogContent.slice(mostRecentReleaseHeading)}`,
  mostRecentReleaseHeading,
)
console.log('CHANGELOG.md') // outputing the relative path of the file to git add it.
await changelog.close()

await Promise.all(
  Object.entries(subPackagesChangelogs).map(([pkg, subsetOfLines]) =>
    updateSubPackageChangelog(pkg, lines, subsetOfLines),
  ),
)
