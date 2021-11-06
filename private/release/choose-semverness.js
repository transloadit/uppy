/* eslint-disable no-continue */

import { createWriteStream, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

import prompts from 'prompts'

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
  releaseFileUrl,
  packagesList
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
      spawnOptions
    )
    if (stdout.length === 0) {
      if (name === '@uppy/robodog') {
        console.log('No commits for robodog, releasing a patch release to update CDN bundle.')
        releaseFile.write(`  ${JSON.stringify(name)}: patch\n`)
      } else {
        console.log(`No commits since last release for ${name}, skipping.`)
      }
      continue
    }
    console.log(
      `Here are the commits that landed on ${name} since previous release:\n\n${stdout}\n`
    )
    console.log(
      `Check the web UI at https://github.com/transloadit/uppy/tree/main/${encodeURI(
        location
      )}.`
    )

    const response = await prompts({
      type: 'select',
      name: 'value',
      message: `What should be the semverness of next ${name} release?`,
      choices: [
        { title: 'Pre-release', value: 'prerelease' },
        { title: 'Skip this package', value: '' },
        { title: 'Patch', value: 'patch' },
        { title: 'Minor', value: 'minor' },
        { title: 'Major', value: 'major' },
      ],
      initial: 2,
    })

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
