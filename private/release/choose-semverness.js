/* eslint-disable no-continue */

import { createWriteStream, mkdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

import prompts from 'prompts'
import { TARGET_BRANCH } from './config.js'

const ROOT = new  URL('../../', import.meta.url)
const PACKAGES_FOLDER = new URL('./packages/', ROOT)

function getRobodogDependencies () {
  const { dependencies } = JSON.parse(readFileSync(new URL('./@uppy/robodog/package.json', PACKAGES_FOLDER)))
  return Object.keys(dependencies)
}

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
  let robodogSemverness
  const robodogDeps = getRobodogDependencies()

  for await (const workspaceInfo of packagesList) {
    const { location, name } = JSON.parse(workspaceInfo)
    if (!name.startsWith('@uppy/')) continue
    if (name === '@uppy/robodog') continue

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
        releaseFile.write(`  ${JSON.stringify(name)}: prerelease\n`)
        uppySemverness = maxSemverness(uppySemverness, 'prerelease')
        if (robodogDeps.includes(name)) {
          robodogSemverness = maxSemverness(robodogSemverness, 'prerelease')
        }
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
      initial: 4,
    })

    if (!response.value) {
      console.log('Skipping.')
      continue
    }

    releaseFile.write(`  ${JSON.stringify(name)}: ${response.value}\n`)
    uppySemverness = maxSemverness(uppySemverness, response.value)
    if (robodogDeps.includes(name)) {
      robodogSemverness = maxSemverness(robodogSemverness, response.value)
    }
  }

  if (uppySemverness == null) throw new Error('No package to release, aborting.')

  {
    // Robodog
    const location = 'packages/@uppy/robodog'
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
      if (robodogSemverness == null) {
        console.log(`No commits since last release for @uppy/robodog, skipping.`)
      } else {
        console.log(`No commits since last release for @uppy/robodog, releasing as ${robodogSemverness}.`)
        releaseFile.write(`  "@uppy/robodog": ${robodogSemverness}\n`)
      }
    } else {
      console.log(
        `Here are the commits that landed on @uppy/robodog since previous release:\n\n${stdout}\n`,
      )
      console.log(
        `Check the web UI at https://github.com/transloadit/uppy/tree/${TARGET_BRANCH}/${encodeURI(
          location,
        )}.`,
      )

      const response = await prompts({
        type: 'select',
        name: 'value',
        message: `What should be the semverness of next @uppy/robodog release?`,
        choices: [
          { title: 'Pre-release', value: 'prerelease' },
          { title: 'Skip this package', value: '', disabled: robodogSemverness != null },
          { title: 'Patch', value: 'patch', disabled: robodogSemverness === 'minor' || robodogSemverness === 'major' },
          { title: 'Minor', value: 'minor', disabled: robodogSemverness === 'major' },
          { title: 'Major', value: 'major' },
        ],
        initial: 0,
      })

      releaseFile.write(`  "@uppy/robodog": ${response.value}\n`)
    }
  }

  releaseFile.write(`  "uppy": ${uppySemverness}\n`)
  releaseFile.close()
}
