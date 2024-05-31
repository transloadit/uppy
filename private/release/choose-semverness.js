/* eslint-disable no-continue */

import { createWriteStream, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

import { TARGET_BRANCH } from './config.js'

function maxSemverness (a, b) {
  if (a === 'major' || b === 'major') return 'major'
  if (a === 'premajor' || b === 'premajor') return 'premajor'
  if (a === 'minor' || b === 'minor') return 'minor'
  if (a === 'preminor' || b === 'preminor') return 'preminor'
  if (a === 'prepatch' || b === 'prepatch') return 'prepatch'
  if (a === 'prepatch' || b === 'prerelease') return 'prerelease'
  return 'patch'
}

export default async function pickSemverness (
  spawnOptions,
  LAST_RELEASE_COMMIT,
  STABLE_BRANCH_MERGE_BASE_RANGE,
  releaseFileUrl,
  packagesList,
) {
  mkdirSync(new URL('.', releaseFileUrl), { recursive: true })
  const releaseFile = createWriteStream(releaseFileUrl)
  releaseFile.write('releases:\n')

  let uppySemverness

  for await (const workspaceInfo of packagesList) {
    const { location, name } = JSON.parse(workspaceInfo)
    if (!name.startsWith('@uppy/')) continue

    const { stdout } = spawnSync(
      'git',
      [
        '--no-pager',
        'log',
        '--format=- %s',
        `${LAST_RELEASE_COMMIT}..`,
        '--',
        location,
      ],
      spawnOptions,
    )
    if (stdout.length === 0) {
      // eslint-disable-next-line no-shadow
      const { stdout } = spawnSync(
        'git',
        [
          '--no-pager',
          'log',
          '--format=- %s',
          STABLE_BRANCH_MERGE_BASE_RANGE,
          '--',
          location,
        ],
        spawnOptions,
      )
      if (stdout.length === 0) {
        console.log(`No commits since last release for ${name}, skipping.`)
      } else {
        console.log(`Some commits have landed on the stable branch since last release for ${name}.`)
        releaseFile.write(`  ${JSON.stringify(name)}: major\n`)
        uppySemverness = 'major'
      }
      continue
    }
    console.log('\n')
    console.log('-'.repeat(20))
    console.log(name)
    console.log(
      `\nHere are the commits that landed on ${name} since previous release:\n${stdout}\n`,
    )
    console.log(
      `Check the web UI at https://github.com/transloadit/uppy/tree/${TARGET_BRANCH}/${encodeURI(
        location,
      )}.`,
    )

    const response = { value: 'major' }

    if (!response.value) {
      console.log('Skipping.')
      continue
    }

    releaseFile.write(`  ${JSON.stringify(name)}: ${response.value}\n`)
    uppySemverness = maxSemverness(uppySemverness, response.value)
  }

  if (uppySemverness == null) throw new Error('No package to release, aborting.')

  releaseFile.write(`  "uppy": ${uppySemverness}\n`)
  releaseFile.close()
}
