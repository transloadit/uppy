import fetch from 'node-fetch'

import { spawnSync } from 'node:child_process'
import prompts from 'prompts'
import { TARGET_BRANCH, REPO_NAME, REPO_OWNER } from './config.js'

async function apiCall (endpoint, errorMessage) {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${endpoint}`
  )
  if (response.ok) {
    return response.json()
  }
  console.warn(response)
  throw new Error(errorMessage)
}

export async function getRemoteHEAD () {
  return (
    await apiCall(
      `/git/ref/heads/${TARGET_BRANCH}`,
      'Cannot get remote HEAD, check your internet connection.'
    )
  ).object.sha
}

async function getLatestReleaseSHA () {
  const { tag_name } = await apiCall(
    `/releases/latest`,
    'Cannot get latest release from GitHub, check your internet connection.'
  )
  return (
    await apiCall(
      `/git/ref/tags/${encodeURIComponent(tag_name)}`,
      `Failed to fetch information for release ${JSON.stringify(tag_name)}`
    )
  ).object.sha
}

export default async function validateGitStatus (spawnOptions) {
  const latestRelease = getLatestReleaseSHA() // run in parallel to speed things up
  const HEAD = await getRemoteHEAD()

  const { status, stderr } = spawnSync(
    'git',
    ['diff', '--exit-code', '--quiet', HEAD, '--', '.'],
    spawnOptions
  )
  if (status !== 0) {
    console.error(stderr.toString())
    console.log(
      `git repository is not clean and/or not in sync with ${REPO_OWNER}/${REPO_NAME}`
    )
    const { value } = await prompts({
      type: 'confirm',
      name: 'value',
      message:
        'Do you want to hard reset your local repository (all uncommitted changes will be lost)?',
    })
    if (!value) {
      throw new Error(
        'Please ensure manually that your local repository is clean and up to date.'
      )
    }

    if (stderr.indexOf('bad object') !== -1) {
      // eslint-disable-next-line no-shadow
      const { status, stdout, stderr } = spawnSync(
        'git',
        [
          'fetch',
          `https://github.com/${REPO_OWNER}/${REPO_NAME}.git`,
          TARGET_BRANCH,
        ],
        spawnOptions
      )

      if (status) {
        console.log(stdout.toString())
        console.error(stderr.toString())
        throw new Error('Failed to fetch, please ensure manually that your local repository is up to date')
      }
    }

    if (spawnSync('git', ['reset', HEAD, '--hard'], spawnOptions).status) {
      throw new Error(
        'Failed to reset, please ensure manually that your local repository is clean and up to date.'
      )
    }
  }

  return latestRelease
}
