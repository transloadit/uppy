import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import prompts from 'prompts'

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
  spawnSync('git', ['commit', '-n', '-m', 'Prepare next release'], spawnOptions)

  console.log('Please run `git push upstream HEAD:release -f`')
}
