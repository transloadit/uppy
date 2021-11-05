#!/usr/bin/env node
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import pickSemverness from './choose-semverness.js'
import commit from './commit-and-open-pr.js'
import formatChangeLog from './formatChangeLog.js'
import validateGitStatus from './getUpToDateRefsFromGitHub.js'

const ROOT = new URL('../../', import.meta.url)
const spawnOptions = { cwd: fileURLToPath(ROOT) }

const deferredReleaseFile = new URL('./.yarn/versions/next.yml', ROOT)
const temporaryChangeLog = new URL('./CHANGELOG.next.md', ROOT)

console.log('Validating local repo status and get previous release info...')
const LAST_RELEASE_COMMIT = await validateGitStatus(spawnOptions)
console.log('Local git repository is ready, starting release process...')
await pickSemverness(spawnOptions, LAST_RELEASE_COMMIT, deferredReleaseFile, process.env.PACKAGES.split(' '))
console.log('Working on the changelog...')
await formatChangeLog(spawnOptions, LAST_RELEASE_COMMIT, temporaryChangeLog)
console.log('Final step...')
await commit(spawnOptions, deferredReleaseFile, temporaryChangeLog)
