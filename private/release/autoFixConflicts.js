#!/usr/bin/env node

// Usage: autoFixConflicts.js | sh

import { createInterface as readLines } from 'node:readline'
import { spawn } from 'node:child_process'

const VERSION_URL = /(?<=https:\/\/\S+\/v)\d+\.\d+\.\d+(?:-(?:alpha|beta)(?:[.-]\d+)?)?(?=\/)/

const gitStatus = spawn('git', ['status', '--porcelain'])

for await (const line of readLines(gitStatus.stdout)) {
  // eslint-disable-next-line no-continue
  if (!line.startsWith('UU ')) continue

  const file = line.slice(3)
  if (file === 'yarn.lock') {
    console.log('corepack yarn install')
    console.log('git add yarn.lock')
    // eslint-disable-next-line no-continue
    continue
  }

  if (file.endsWith('/package.json')) {
    console.log(`git checkout --ours ${file}`)
    console.log(`git add ${file}`)
    // eslint-disable-next-line no-continue
    continue
  }

  const gitDiff = spawn('git', ['--no-pager', 'diff', '--', file])
  let conflictHasStarted = false
  let containsCDNChanges = true
  let currentConflictContainsCDNChanges = false

  // eslint-disable-next-line no-shadow
  for await (const line of readLines(gitDiff.stdout)) {
    if (conflictHasStarted) {
      if (line.startsWith('++>>>>>>>')) {
        conflictHasStarted = false
        containsCDNChanges &&= currentConflictContainsCDNChanges
        currentConflictContainsCDNChanges = false
      } else {
        currentConflictContainsCDNChanges ||= VERSION_URL.test(line)
      }
    } else if (line === '++<<<<<<< HEAD') {
      conflictHasStarted = true
    }
  }
  if (containsCDNChanges) {
    console.log(`git checkout --ours ${file}`)
    console.log(`git add ${file}`)
    // eslint-disable-next-line no-continue
    continue
  }
}
