import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import prompts from 'prompts'
import { REPO_NAME, REPO_OWNER, TARGET_BRANCH } from './config.js'

function runProcessOrThrow (...args) {
  const cp = spawnSync(...args)

  if (cp.status) {
    console.log(cp.stdout.toString())
    console.error(cp.stderr.toString())
    throw new Error(`Non-zero status: ${cp.status}. ${args}`)
  }

  return cp
}

function getContentFromProcessSync (...args) {
  return runProcessOrThrow(...args).stdout.toString().trim()
}

export default async function commit (spawnOptions, STABLE_HEAD, ...files) {
  console.log(`Now is the time to do manual edits to ${files.join(',')}.`)
  await prompts({
    type: 'toggle',
    name: 'value',
    message: 'Ready to commit?',
    initial: true,
    active: 'yes',
    inactive: 'yes',
  })

  spawnSync('git', ['add', ...files.map(url => fileURLToPath(url))], spawnOptions)
  spawnSync('git', ['commit', '-n', '-m', 'Prepare next release'], { ...spawnOptions, stdio: 'inherit' })

  // Reverting to the remote head before starting the merge. We keep the git sha
  // in a variable to cherry-pick it later.
  const releaseSha = getContentFromProcessSync('git', ['rev-parse', 'HEAD'], spawnOptions)
  runProcessOrThrow('git', ['reset', 'HEAD^', '--hard'])

  console.log('Attempting to merge changes from stable branch...')
  {
    // eslint-disable-next-line no-shadow
    const { status, stdout, stderr } = spawnSync(
      'git',
      [
        'merge',
        '--no-edit',
        '-m',
        'Merge stable branch',
        STABLE_HEAD,
      ],
      spawnOptions,
    )
    if (status) {
      console.log(stdout.toString())
      console.error(stderr.toString())

      await prompts({
        type: 'toggle',
        name: 'value',
        message: 'Fix the conflicts, and stage the files. Ready?',
        initial: true,
        active: 'yes',
        inactive: 'yes',
      })

      // eslint-disable-next-line no-shadow
      const { status } = spawnSync(
        'git',
        [
          'merge',
          '--continue',
        ],
        { ...spawnOptions, stdio: 'inherit' },
      )

      if (status) {
        throw new Error('Merge has failed')
      }
    }
  }

  const mergeSha = getContentFromProcessSync('git', ['rev-parse', 'HEAD'], spawnOptions)
  runProcessOrThrow('git', ['cherry-pick', releaseSha], spawnOptions)
  const sha = getContentFromProcessSync('git', ['rev-parse', 'HEAD'], spawnOptions)

  const getRemoteCommamnd = `git remote -v | grep '${REPO_OWNER}/${REPO_NAME}' | awk '($3 == "(push)") { print $1; exit }'`
  const remote = spawnSync('/bin/sh', ['-c', getRemoteCommamnd]).stdout.toString().trim()
                 || `git@github.com:${REPO_OWNER}/${REPO_NAME}.git`

  console.log(`Please run \`git push ${remote} ${sha}:refs/heads/release-beta\`.`)
  console.log(`An automation will kick off and open a release candidate PR 
    on the GitHub repository. Do not merge it manually! Review the PR (you may need to close and
    re-open so the CI and test will run on it). If everything looks good, run
    \`git push ${mergeSha}:refs/heads/${TARGET_BRANCH}\`, and approve the PR — 
    this will publish updated packages to npm, then the PR will be merged.`)
}
