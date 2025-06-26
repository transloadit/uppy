#!/usr/bin/env node

// Usage: autoFixConflicts.js | sh

import { spawn } from 'node:child_process'
import { createInterface as readLines } from 'node:readline'

const VERSION_URL =
  /(?<=https:\/\/\S+\/v)\d+\.\d+\.\d+(?:-(?:alpha|beta)(?:[.-]\d+)?)?(?=\/)/

const gitStatus = spawn('git', ['status', '--porcelain'])

for await (const line of readLines(gitStatus.stdout)) {
  if (!line.startsWith('UU ')) continue

  const file = line.slice(3)
  if (file === 'yarn.lock') {
    console.log('corepack yarn install')
    console.log('git add yarn.lock')
    continue
  }

  if (file.endsWith('/package.json')) {
    console.log(`git checkout --ours ${file}`)
    console.log(`git add ${file}`)
    continue
  }

  const gitDiff = spawn('git', ['--no-pager', 'diff', '--', file])
  let conflictHasStarted = false
  let containsCDNChanges = true
  let currentConflictContainsCDNChanges = false

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
  }
}
