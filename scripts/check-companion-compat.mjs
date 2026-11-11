#!/usr/bin/env node

// Checks that hosted Companion is new enough for the Companion client we are
// about to release.
//
// `uppy.minCompanionVersion` in packages/@uppy/core/package.json is the
// minimum Companion version that core's Companion client
// (src/companion-client) needs. It says nothing about other packages that
// talk to Companion: @uppy/s3 and @uppy/transloadit-storage use endpoints
// that arrived in Companion 7.1.0 and are not covered here.
//
// This runs before `changeset publish` and in CI on every PR. It fails when
// the minimum is newer than the Companion in this repo, or when any hosted
// Companion endpoint runs an older version. On a PR that doesn't change the
// minimum, an unreachable endpoint is only a warning.
//
// The release order this enforces for a client change that needs new
// Companion behaviour (the two cannot merge together):
//   1. The Companion change merges and is released on its own (Companion
//      keeps serving old clients).
//   2. Hosted Companion is upgraded.
//   3. The client change merges and raises minCompanionVersion.
//
// While hosted runs below the minimum (for example after a rollback), every
// PR's check is red and releases are blocked, a Companion fix included. The
// escape is a PR that lowers minCompanionVersion.
//
// Not covered: the manual CDN workflow, which uploads from main without
// running this check.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const ENDPOINTS = [
  'https://api2.transloadit.com/companion/',
  'https://api2-us-east-1.transloadit.com/companion/',
  'https://api2-eu-west-1.transloadit.com/companion/',
  'https://api2-ap-southeast-1.transloadit.com/companion/',
]
const CORE_PACKAGE_JSON = 'packages/@uppy/core/package.json'
const COMPANION_PACKAGE_JSON = 'packages/@uppy/companion/package.json'
const repoRoot = new URL('../', import.meta.url)

// x.y.z with an optional -prerelease and +build suffix (semver 2.0.0).
const VERSION =
  /(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?/
    .source

export function parseVersion(version) {
  const match = new RegExp(`^${VERSION}$`).exec(version)
  if (!match) throw new Error(`Not a semver version: ${version}`)
  return {
    release: match.slice(1, 4).map(Number),
    prerelease: match[4]?.split('.') ?? [],
  }
}

function compareIdentifiers(a, b) {
  const aNumeric = /^\d+$/.test(a)
  const bNumeric = /^\d+$/.test(b)
  if (aNumeric && bNumeric) return Math.sign(Number(a) - Number(b))
  // Numeric identifiers sort before alphanumeric ones.
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1
  return a === b ? 0 : a > b ? 1 : -1
}

// Semver precedence: build metadata is ignored, and a prerelease of x.y.z
// sorts below x.y.z itself.
export function compareVersions(a, b) {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  for (let i = 0; i < 3; i++) {
    if (pa.release[i] !== pb.release[i])
      return pa.release[i] > pb.release[i] ? 1 : -1
  }
  const [preA, preB] = [pa.prerelease, pb.prerelease]
  if (preA.length === 0 || preB.length === 0) {
    return Math.sign(preB.length - preA.length)
  }
  for (let i = 0; i < Math.min(preA.length, preB.length); i++) {
    const result = compareIdentifiers(preA[i], preB[i])
    if (result !== 0) return result
  }
  return Math.sign(preA.length - preB.length)
}

// Returns the version without its +build suffix.
export function parseHostedVersion(body) {
  const match = new RegExp(
    `^Welcome to Companion v(${VERSION})\\r?$`,
    'm',
  ).exec(body)
  return match?.[1].replace(/\+.*/, '')
}

export function evaluate({
  min,
  repoCompanion,
  hosted,
  fieldChanged,
  isPullRequest,
}) {
  const lines = []
  const warnings = []
  let ok = true

  if (compareVersions(min, repoCompanion) > 0) {
    ok = false
    lines.push(
      `minCompanionVersion ${min} is newer than the Companion in this repo (${repoCompanion}). Land and release the Companion change first, deploy it to hosted Companion, then raise the minimum in a separate PR.`,
    )
  }

  for (const { url, version, error } of hosted) {
    if (version === undefined) {
      const message = `Could not read the Companion version from ${url}: ${error}.`
      if (isPullRequest && !fieldChanged) {
        lines.push(`?    ${url} unknown`)
        warnings.push(
          `${message} Not failing because this PR doesn't change minCompanionVersion.`,
        )
      } else {
        ok = false
        lines.push(`FAIL ${url} unknown`, message)
      }
    } else if (compareVersions(version, min) < 0) {
      ok = false
      lines.push(
        `FAIL ${url} ${version} < ${min}`,
        `Hosted Companion at ${url} runs ${version}; this client needs >= ${min}. Deploy Companion >= ${min} to hosted first. If hosted was rolled back on purpose, lower minCompanionVersion in a PR.`,
      )
    } else {
      lines.push(`ok   ${url} ${version} >= ${min}`)
    }
  }

  return { ok, lines, warnings }
}

// Resolves to { version } or, when the version can't be read, { error }.
export async function fetchVersion(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return { error: `HTTP ${res.status} ${res.statusText}` }
    const version = parseHostedVersion(await res.text())
    return version
      ? { version }
      : { error: `HTTP ${res.status} without a welcome line` }
  } catch (err) {
    return { error: err.cause?.message ?? err.message }
  }
}

async function fetchHosted() {
  const results = new Map()
  for (let round = 0; round <= 3; round++) {
    const pending = ENDPOINTS.filter((url) => !results.get(url)?.version)
    if (pending.length === 0) break
    if (round > 0) await sleep(20_000)
    await Promise.all(
      pending.map(async (url) => results.set(url, await fetchVersion(url))),
    )
  }
  return ENDPOINTS.map((url) => ({ url, ...results.get(url) }))
}

function git(...args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function minCompanionVersionOf(packageJson) {
  return JSON.parse(packageJson).uppy?.minCompanionVersion
}

async function main() {
  const min = minCompanionVersionOf(
    readFileSync(new URL(CORE_PACKAGE_JSON, repoRoot), 'utf8'),
  )
  const repoCompanion = JSON.parse(
    readFileSync(new URL(COMPANION_PACKAGE_JSON, repoRoot), 'utf8'),
  ).version
  const isPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request'

  let fieldChanged = true
  const warnings = []
  if (isPullRequest) {
    // The PR checkout is a merge commit, so HEAD^1 is the base branch.
    try {
      fieldChanged =
        minCompanionVersionOf(git('show', `HEAD^1:${CORE_PACKAGE_JSON}`)) !==
        min
    } catch {
      fieldChanged = true
    }

    try {
      const changed = git('diff', '--name-only', 'HEAD^1', 'HEAD').split('\n')
      const touches = (prefix) =>
        changed.some((file) => file.startsWith(prefix))
      if (
        !fieldChanged &&
        touches('packages/@uppy/core/src/companion-client/') &&
        touches('packages/@uppy/companion/src/')
      ) {
        warnings.push(
          'This PR changes the Companion client and Companion together. If the client now needs the new Companion behaviour, split it: release Companion first, then raise minCompanionVersion with the client change.',
        )
      }
    } catch {}
  }

  const result = evaluate({
    min,
    repoCompanion,
    hosted: await fetchHosted(),
    fieldChanged,
    isPullRequest,
  })

  for (const line of result.lines) console.log(line)
  for (const warning of [...warnings, ...result.warnings]) {
    console.log(`::warning::${warning}`)
  }
  if (!result.ok) process.exitCode = 1
}

if (import.meta.main) {
  try {
    await main()
  } catch (err) {
    console.log(
      `::error::check-companion-compat failed: ${err instanceof Error ? err.message : err}`,
    )
    process.exitCode = 1
  }
}
