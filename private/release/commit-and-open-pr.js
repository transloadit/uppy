import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import prompts from 'prompts'
import { REPO_OWNER, REPO_NAME } from './config.js'

export default async function commit (spawnOptions, ...files) {
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
  const sha = spawnSync('git', ['rev-parse', 'HEAD'], spawnOptions).stdout.toString().trim()
  const getRemoteCommamnd = `git remote -v | grep '${REPO_OWNER}/${REPO_NAME}' | awk '($3 == "(push)") { print $1; exit }'`
  const remote = spawnSync('/bin/sh', ['-c', getRemoteCommamnd]).stdout.toString().trim()
                 || `git@github.com:${REPO_OWNER}/${REPO_NAME}.git`

  console.log(`Please run \`git push ${remote} ${sha}:refs/heads/release\`.`)
}
