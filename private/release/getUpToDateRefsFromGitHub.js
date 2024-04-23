import { spawnSync } from 'node:child_process'
import prompts from 'prompts'
import { TARGET_BRANCH, REPO_NAME, REPO_OWNER, STABLE_BRANCH } from './config.js'

async function apiCall (endpoint, errorMessage) {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${endpoint}`,
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
      'Cannot get remote HEAD, check your internet connection.',
    )
  ).object.sha
}

async function getLatestReleaseSHA () {
  const response = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${TARGET_BRANCH}/packages/uppy/package.json`)
  if (!response.ok) throw new Error(`Network call failed: ${response.status} ${response.statusText}`)
  const { version } = await response.json()
  const tag_name = `uppy@${version}`
  console.log(`Last release was ${tag_name}.`)
  return (
    await apiCall(
      `/git/ref/tags/${encodeURIComponent(tag_name)}`,
      `Failed to fetch information for release ${JSON.stringify(tag_name)}`,
    )
  ).object.sha
}

function getStableBranchMergeBase (REMOTE_HEAD) {
  spawnSync('git', ['fetch', `https://github.com/${REPO_OWNER}/${REPO_NAME}.git`, STABLE_BRANCH])
  const STABLE_HEAD = spawnSync('git', ['rev-parse', 'FETCH_HEAD']).stdout.toString().trim()
  return [[
    spawnSync('git', ['merge-base', REMOTE_HEAD, 'FETCH_HEAD']).stdout.toString().trim(),
    STABLE_HEAD,
  ].join('..'), STABLE_HEAD]
}

async function getLocalHEAD () {
  return spawnSync('git', ['rev-parse', 'HEAD']).stdout.toString().trim()
}

export function rewindGitHistory (spawnOptions, sha) {
  return spawnSync('git', ['reset', sha, '--hard'], spawnOptions).status === 0
}

export async function validateGitStatus (spawnOptions) {
  const latestRelease = getLatestReleaseSHA() // run in parallel to speed things up
  const [REMOTE_HEAD, LOCAL_HEAD] = await Promise.all([getRemoteHEAD(), getLocalHEAD()])

  const { status, stderr } = spawnSync(
    'git',
    ['diff', '--exit-code', '--quiet', REMOTE_HEAD, '--', '.'],
    spawnOptions,
  )
  if (status !== 0) {
    console.error(stderr.toString())
    console.log(
      `git repository is not clean and/or not in sync with ${REPO_OWNER}/${REPO_NAME}`,
    )
    if (spawnSync(
      'git',
      ['diff', '--exit-code', '--quiet', LOCAL_HEAD, '--', '.'],
      spawnOptions,
    ).status !== 0) {
      const { value } = await prompts({
        type: 'confirm',
        name: 'value',
        message:
          'Do you want to hard reset your local repository (all uncommitted changes will be lost)?',
      })
      if (!value) {
        throw new Error(
          'Please ensure manually that your local repository is clean and up to date.',
        )
      }
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
        spawnOptions,
      )

      if (status) {
        console.log(stdout.toString())
        console.error(stderr.toString())
        throw new Error('Failed to fetch, please ensure manually that your local repository is up to date')
      }
    }

    if (!rewindGitHistory(spawnOptions, REMOTE_HEAD)) {
      throw new Error(
        'Failed to reset, please ensure manually that your local repository is clean and up to date.',
      )
    }
  }

  return [await latestRelease, LOCAL_HEAD, ...getStableBranchMergeBase(REMOTE_HEAD)]
}
