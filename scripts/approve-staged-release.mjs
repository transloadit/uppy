#!/usr/bin/env node

/**
 * Approves the packages that CI staged, publishing them for real.
 *
 * Approval is the proof-of-presence step of staged publishing: it always
 * requires 2FA and can never be done by a token, so it has to run locally by a
 * maintainer who is `npm login`ed. See RELEASE.md.
 *
 * A single one-time password is reused for as long as the registry accepts it,
 * and you are only asked for a new one once it is refused.
 *
 * Usage:
 *   yarn release:approve                  approve everything staged for this repo
 *   yarn release:approve @uppy/core       approve one package only
 *   yarn release:approve --dry-run        show what would be approved
 */

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const packageFilters = args.filter((arg) => !arg.startsWith('-'))

function exec(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: 'pipe' })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

async function execOrThrow(command, commandArgs) {
  const result = await exec(command, commandArgs)
  if (result.code !== 0) {
    throw new Error(
      `\`${command} ${commandArgs.join(' ')}\` exited with ${result.code}\n${result.stderr || result.stdout}`,
    )
  }
  return result
}

/** Package names in this monorepo, so we never touch someone else's staged package. */
async function getWorkspacePackageNames() {
  const { stdout } = await execOrThrow('yarn', ['workspaces', 'list', '--json'])
  return new Set(
    stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((workspace) => workspace.location !== '.')
      .filter(
        (workspace) =>
          !JSON.parse(
            readFileSync(path.join(workspace.location, 'package.json'), 'utf8'),
          ).private,
      )
      .map((workspace) => workspace.name),
  )
}

async function getStagedItems() {
  const result = await exec('npm', ['stage', 'list', '--json'])
  if (result.code !== 0) {
    if (/E401|ENEEDAUTH/.test(result.stderr)) {
      throw new Error(
        'You are not logged in to npm. Run `npm login` first — approving needs your own account, tokens cannot do it.',
      )
    }
    if (/Unknown command|not a valid command/i.test(result.stderr)) {
      throw new Error(
        'This npm does not know `npm stage`. Staged publishing needs npm 11.15.0 or newer — run `npm install --global npm@latest`.',
      )
    }
    throw new Error(result.stderr || result.stdout)
  }
  return JSON.parse(result.stdout)
}

function isOtpError(result) {
  return /EOTP|one-?time pass|otp/i.test(`${result.stderr}${result.stdout}`)
}

async function main() {
  const workspaceNames = await getWorkspacePackageNames()
  const staged = (await getStagedItems())
    .filter((item) => workspaceNames.has(item.packageName))
    .filter(
      (item) =>
        packageFilters.length === 0 ||
        packageFilters.includes(item.packageName),
    )
    .sort((a, b) => a.packageName.localeCompare(b.packageName))

  if (staged.length === 0) {
    console.log('Nothing staged to approve.')
    return
  }

  console.log(`${staged.length} staged version(s) waiting for approval:\n`)
  for (const item of staged) {
    console.log(
      `  ${item.packageName}@${item.version} (tag: ${item.tag}, staged by ${item.actor} on ${item.createdAt})`,
    )
  }
  console.log('')

  if (dryRun) {
    console.log('Dry run, not approving anything.')
    return
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const confirmation = await rl.question(
      `Approve and publish all ${staged.length}? [y/N] `,
    )
    if (!/^y(es)?$/i.test(confirmation.trim())) {
      console.log('Aborted.')
      process.exitCode = 1
      return
    }

    let otp = null
    const approved = []
    const failed = []

    for (const item of staged) {
      const label = `${item.packageName}@${item.version}`
      let settled = false
      // Retry only to re-prompt for a fresh one-time password, not to hammer
      // the registry on a genuine failure.
      for (let attempt = 0; attempt < 3 && !settled; attempt++) {
        otp ??= (await rl.question('npm one-time password: ')).trim()
        const result = await exec('npm', [
          'stage',
          'approve',
          item.id,
          '--otp',
          otp,
        ])

        if (result.code === 0) {
          console.log(`  published ${label}`)
          approved.push(label)
          settled = true
        } else if (isOtpError(result)) {
          console.log('  one-time password was refused, asking for a new one')
          otp = null
        } else {
          console.error(result.stderr || result.stdout)
          failed.push(label)
          settled = true
        }
      }

      if (!settled) failed.push(label)
    }

    console.log(`\nPublished ${approved.length}/${staged.length} package(s).`)
    if (failed.length > 0) {
      console.error(
        `Failed: ${failed.join(', ')}\nThey are still staged — rerun this command, or reject them with \`npm stage reject <stage-id>\`.`,
      )
      process.exitCode = 1
    }
  } finally {
    rl.close()
  }
}

try {
  await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
