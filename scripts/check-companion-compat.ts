#!/usr/bin/env node

// Checks that hosted Companion is new enough for the Companion client we are
// about to release.
//
// `uppy.minCompanionVersion` in a published package's package.json is the
// minimum Companion version that package's client code needs: @uppy/core
// for its Companion client (src/companion-client), @uppy/s3 and
// @uppy/transloadit-storage for the /s3/* and /transloadit-storage/*
// endpoints that arrived in Companion 7.1.0. The check uses the highest
// minimum of all packages under packages/@uppy/ and packages/uppy.
//
// It finds a problem when the minimum is newer than the Companion in this
// repo, or when a hosted Companion endpoint runs an older version or can't
// be read. Where it runs, and what a problem does there:
//   - before `changeset publish` (--release): fails, but only when the
//     publish plan holds a package that declares a minimum or bundles one
//     (BUNDLES), so a hosted outage doesn't block unrelated releases.
//   - before a manual CDN upload of the `uppy` bundle (no flag): fails.
//   - in CI on a PR (--ci): fails when the PR changes a minimum or touches
//     client code that talks to Companion (CLIENT_PATHS), otherwise warns.
//   - in CI on a push (--ci): warns.
// In CI on a PR it also fails when the PR touches CLIENT_PATHS without
// changing a minimum, unless its description has an OPT_OUT_MARKER line
// saying the change needs no newer Companion.
//
// The release order this enforces for a client change that needs new
// Companion behaviour (the two cannot merge together):
//   1. The Companion change merges and is released on its own (Companion
//      keeps serving old clients).
//   2. Hosted Companion is upgraded.
//   3. The client change merges and raises minCompanionVersion.
//
// While hosted runs below the minimum (for example after a rollback),
// releases of the client are blocked, and so are PRs that touch it. The escape is a PR that lowers minCompanionVersion.
//
// Node runs this file with its built-in type stripping (Node 22.18+), so it
// may only use erasable TypeScript syntax.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

// Hosted Companion: the global address is Transloadit.COMPANION_URL in
// packages/@uppy/transloadit/src/index.ts, the others are the regional API2
// hosts its TL_COMPANION pattern accepts and that Assemblies may hand out as
// `companion_url`. Transloadit's region list isn't in this repo, so keep this
// one in sync by hand when regions are added or removed.
// COMPANION_COMPAT_ENDPOINTS (comma-separated) overrides it, for testing.
export const ENDPOINTS = [
  'https://api2.transloadit.com/companion/',
  'https://api2-us-east-1.transloadit.com/companion/',
  'https://api2-eu-west-1.transloadit.com/companion/',
  'https://api2-ap-southeast-1.transloadit.com/companion/',
]
const COMPANION_PACKAGE_JSON = 'packages/@uppy/companion/package.json'
// Client code that talks to Companion, in the packages that declare a
// minimum. Keep in sync with the packages that carry the field.
export const CLIENT_PATHS = [
  'packages/@uppy/core/src/companion-client/',
  'packages/@uppy/core/src/provider-views/',
  'packages/@uppy/s3/src/',
  'packages/@uppy/transloadit-storage/src/',
]
// A line in a PR description saying that its client change needs no newer
// Companion. A description is used rather than a label so that authors of
// fork PRs can set it too.
export const OPT_OUT_MARKER = 'companion-compat: none'
const OPT_OUT = new RegExp(`^\\s*${OPT_OUT_MARKER}\\s*$`, 'im')
// Published packages that bundle the packages declaring a minimum.
const BUNDLES = ['uppy']
const REPO_ROOT = new URL('../', import.meta.url)

// The parts of a package.json this reads.
interface PackageJson {
  name: string
  version: string
  private?: boolean
  uppy?: { minCompanionVersion?: string }
}

// The file `changeset publish-plan --output` writes: releases in publish
// order, grouped into batches.
interface PublishPlan {
  version: 1
  plan: (
    | {
        kind: 'publish'
        name: string
        version: string
        access: string
        tag: string
      }
    | { kind: 'tag-only'; name: string; version: string }
  )[][]
}

// The parts of a GitHub pull request, in an event payload or from the API,
// that this reads.
interface PullRequest {
  number: number
  body: string | null
}

export interface Version {
  release: [major: number, minor: number, patch: number]
  prerelease: string[]
}

// A hosted Companion's version, or why it couldn't be read.
export type FetchResult =
  | { version: string; error?: never }
  | { error: string; version?: never }

export interface Hosted {
  url: string
  version?: string
  error?: string
}

export interface Evaluation {
  ok: boolean
  lines: string[]
  warnings: string[]
}

export interface MainOptions {
  argv?: readonly string[]
  root?: URL
  env?: NodeJS.ProcessEnv
  endpoints?: readonly string[] | undefined
  retryDelayMs?: number | undefined
  publishPlan?: ((root: URL) => readonly string[]) | undefined
  log?: (line: string) => void
}

// x.y.z with an optional -prerelease and +build suffix (semver 2.0.0).
const VERSION =
  /(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?/
    .source

export function parseVersion(version: string): Version {
  const match = new RegExp(`^${VERSION}$`).exec(version)
  if (!match) throw new Error(`Not a semver version: ${version}`)
  const [, major, minor, patch, prerelease] = match
  return {
    release: [Number(major), Number(minor), Number(patch)],
    prerelease: prerelease?.split('.') ?? [],
  }
}

function compareIdentifiers(a: string, b: string): number {
  const aNumeric = /^\d+$/.test(a)
  const bNumeric = /^\d+$/.test(b)
  if (aNumeric && bNumeric) return Math.sign(Number(a) - Number(b))
  // Numeric identifiers sort before alphanumeric ones.
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1
  return a === b ? 0 : a > b ? 1 : -1
}

// Semver precedence: build metadata is ignored, and a prerelease of x.y.z
// sorts below x.y.z itself.
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  for (const i of [0, 1, 2] as const) {
    if (pa.release[i] !== pb.release[i])
      return pa.release[i] > pb.release[i] ? 1 : -1
  }
  const [preA, preB] = [pa.prerelease, pb.prerelease]
  if (preA.length === 0 || preB.length === 0) {
    return Math.sign(preB.length - preA.length)
  }
  for (let i = 0; i < Math.min(preA.length, preB.length); i++) {
    const result = compareIdentifiers(preA[i]!, preB[i]!)
    if (result !== 0) return result
  }
  return Math.sign(preA.length - preB.length)
}

// Reads the version from the plain-text welcome page that standalone
// Companion serves at its root (buildHelpfulStartupMessage in
// packages/@uppy/companion/src/standalone/helper.ts), without its +build
// suffix. Companion has no other public version source, and a deployment
// with COMPANION_HIDE_WELCOME=true reads as unknown. The line's format is
// pinned by packages/@uppy/companion/test/welcome.test.ts.
export function parseHostedVersion(body: string): string | undefined {
  const match = new RegExp(
    `^Welcome to Companion v(${VERSION})\\r?$`,
    'm',
  ).exec(body)
  return match?.[1]?.replace(/\+.*/, '')
}

// With `strict`, each problem fails the check; otherwise it is a warning.
export function evaluate({
  min,
  repoCompanion,
  hosted,
  strict = true,
}: {
  min: string
  repoCompanion: string
  hosted: readonly Hosted[]
  strict?: boolean
}): Evaluation {
  const lines: string[] = []
  const warnings: string[] = []
  let ok = true
  const problem = (line: string, message: string) => {
    if (strict) {
      ok = false
      lines.push(`FAIL ${line}`, message)
    } else {
      lines.push(`warn ${line}`)
      warnings.push(message)
    }
  }

  if (compareVersions(min, repoCompanion) > 0) {
    problem(
      `minCompanionVersion ${min} > repo Companion ${repoCompanion}`,
      `minCompanionVersion ${min} is newer than the Companion in this repo (${repoCompanion}). Land and release the Companion change first, deploy it to hosted Companion, then raise the minimum in a separate PR.`,
    )
  }

  for (const { url, version, error } of hosted) {
    if (version === undefined) {
      problem(
        `${url} unknown`,
        `Could not read the Companion version from ${url}: ${error}.`,
      )
    } else if (compareVersions(version, min) < 0) {
      problem(
        `${url} ${version} < ${min}`,
        `Hosted Companion at ${url} runs ${version}; this client needs >= ${min}. Deploy Companion >= ${min} to hosted first. If hosted was rolled back on purpose, lower minCompanionVersion in a PR.`,
      )
    } else {
      lines.push(`ok   ${url} ${version} >= ${min}`)
    }
  }

  return { ok, lines, warnings }
}

export async function fetchVersion(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return { error: `HTTP ${res.status} ${res.statusText}` }
    const version = parseHostedVersion(await res.text())
    return version
      ? { version }
      : { error: `HTTP ${res.status} without a welcome line` }
  } catch (err) {
    const { cause, message } = err as Error & { cause?: Error }
    return { error: cause?.message ?? message }
  }
}

// Retries endpoints whose version couldn't be read, to ride out a deploy.
export async function fetchHosted(
  endpoints: readonly string[],
  {
    retries = 3,
    delayMs = 20_000,
  }: { retries?: number; delayMs?: number | undefined } = {},
): Promise<Hosted[]> {
  const results = new Map<string, FetchResult>()
  for (let round = 0; round <= retries; round++) {
    const pending = endpoints.filter((url) => !results.get(url)?.version)
    if (pending.length === 0) break
    if (round > 0) await sleep(delayMs)
    await Promise.all(
      pending.map(async (url) => results.set(url, await fetchVersion(url))),
    )
  }
  return endpoints.map((url) => ({ url, ...results.get(url) }))
}

function git(root: URL, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function readJson<T>(file: URL | string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T
}

function packageJsonPaths(root: URL): string[] {
  return [
    ...readdirSync(new URL('packages/@uppy/', root)).map(
      (dir) => `packages/@uppy/${dir}/package.json`,
    ),
    'packages/uppy/package.json',
  ]
}

// The minimum each published package declares, read with `read(file)`; a
// file it can't read is skipped.
export function minimumsOf(
  paths: readonly string[],
  read: (file: string) => string,
): Map<string, string> {
  const minimums = new Map<string, string>()
  for (const file of paths) {
    let contents: string
    try {
      contents = read(file)
    } catch {
      continue
    }
    const {
      name,
      private: isPrivate,
      uppy,
    } = JSON.parse(contents) as PackageJson
    if (!isPrivate && uppy?.minCompanionVersion) {
      minimums.set(name, uppy.minCompanionVersion)
    }
  }
  return minimums
}

export function highestMinimum(minimums: ReadonlyMap<string, string>): {
  name: string
  min: string
} {
  let highest: ReturnType<typeof highestMinimum> | undefined
  for (const [name, min] of minimums) {
    if (!highest || compareVersions(min, highest.min) > 0) {
      highest = { name, min }
    }
  }
  if (!highest) {
    throw new Error('No published package declares uppy.minCompanionVersion')
  }
  return highest
}

function sameMinimums(
  a: ReadonlyMap<string, string>,
  b: ReadonlyMap<string, string>,
): boolean {
  return a.size === b.size && [...a].every(([name, min]) => b.get(name) === min)
}

// The event payload holds the description as of the push, so an edit
// followed by a re-run would go unseen; ask the API for the current one and
// fall back to the payload.
async function pullRequestBody(env: NodeJS.ProcessEnv): Promise<string> {
  let pr: PullRequest | undefined
  try {
    pr = readJson<{ pull_request?: PullRequest }>(
      env.GITHUB_EVENT_PATH ?? '',
    ).pull_request
  } catch {
    return ''
  }
  if (!pr) return ''
  try {
    const res = await fetch(
      `${env.GITHUB_API_URL}/repos/${env.GITHUB_REPOSITORY}/pulls/${pr.number}`,
      {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${env.GITHUB_TOKEN}`,
        },
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (res.ok) return ((await res.json()) as PullRequest).body ?? ''
  } catch {}
  return pr.body ?? ''
}

// The names of the packages `changeset publish` would publish now. It asks
// the registry with the same logic, which also covers pre mode and packages
// left unpublished by an earlier failed release.
function packagesToPublish(root: URL): string[] {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'companion-compat-plan-'))
  try {
    const output = path.join(dir, 'plan.json')
    execFileSync('yarn', ['changeset', 'publish-plan', '--output', output], {
      cwd: root,
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    return readJson<PublishPlan>(output)
      .plan.flat()
      .filter((release) => release.kind === 'publish')
      .map((release) => release.name)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// Runs the check and returns the exit code. Everything it reads from outside
// can be injected, for tests.
export async function main({
  argv = process.argv.slice(2),
  root = REPO_ROOT,
  env = process.env,
  endpoints = env.COMPANION_COMPAT_ENDPOINTS?.split(',') ?? ENDPOINTS,
  retryDelayMs,
  publishPlan = packagesToPublish,
  log = console.log,
}: MainOptions = {}): Promise<number> {
  const paths = packageJsonPaths(root)
  const minimums = minimumsOf(paths, (file) =>
    readFileSync(new URL(file, root), 'utf8'),
  )
  const { name: minFrom, min } = highestMinimum(minimums)
  const repoCompanion = readJson<PackageJson>(
    new URL(COMPANION_PACKAGE_JSON, root),
  ).version

  if (argv.includes('--release')) {
    const toPublish = publishPlan(root)
    const concerned = toPublish.filter(
      (name) => minimums.has(name) || BUNDLES.includes(name),
    )
    if (concerned.length === 0) {
      const what = toPublish.length
        ? `None of ${toPublish.join(', ')} talks to Companion`
        : 'Nothing to publish'
      log(`${what}; skipping the check.`)
      return 0
    }
    log(`About to publish ${concerned.join(', ')}.`)
  }

  let strict = true
  const errors: string[] = []
  if (argv.includes('--ci') && env.GITHUB_EVENT_NAME === 'pull_request') {
    // The PR checkout is a merge commit, so HEAD^1 is the base branch.
    // Without a readable base every package reads as new and every file as
    // changed, so this errs towards strict, but the guard below can't run.
    try {
      git(root, 'rev-parse', '--verify', '--quiet', 'HEAD^1')
    } catch {
      log(
        '::warning::Cannot read the PR base (HEAD^1; is fetch-depth at least 2?). Hosted problems fail, but the minCompanionVersion guard is skipped.',
      )
    }
    const baseMinimums = minimumsOf(paths, (file) =>
      git(root, 'show', `HEAD^1:${file}`),
    )
    const fieldChanged = !sameMinimums(baseMinimums, minimums)
    let touches: (prefix: string) => boolean = () => true
    try {
      const changed = git(root, 'diff', '--name-only', 'HEAD^1', 'HEAD').split(
        '\n',
      )
      touches = (prefix) => changed.some((file) => file.startsWith(prefix))
    } catch {}
    const clientPaths = CLIENT_PATHS.filter(touches)
    strict = fieldChanged || clientPaths.length > 0
    if (!strict) {
      log(
        "Problems below are warnings: this PR changes no minCompanionVersion and doesn't touch client code that talks to Companion.",
      )
    }

    if (
      !fieldChanged &&
      clientPaths.length > 0 &&
      !OPT_OUT.test(await pullRequestBody(env))
    ) {
      errors.push(
        `This PR changes client code that talks to Companion (${clientPaths.join(', ')}) but no uppy.minCompanionVersion. If the client now needs newer Companion behaviour, release and deploy that Companion first, then raise uppy.minCompanionVersion in the package's package.json in this PR. If it doesn't, add a line "${OPT_OUT_MARKER}" to the PR description and re-run this job.`,
      )
    }
  } else if (argv.includes('--ci')) {
    strict = false
    log('Problems below are warnings outside PRs; the release enforces them.')
  }

  const result = evaluate({
    min,
    repoCompanion,
    // Retrying only pays off when a problem would fail the job.
    hosted: await fetchHosted(endpoints, {
      delayMs: retryDelayMs,
      ...(!strict && { retries: 0 }),
    }),
    strict,
  })

  log(`minCompanionVersion ${min} (from ${minFrom})`)
  for (const line of result.lines) log(line)
  for (const warning of result.warnings) log(`::warning::${warning}`)
  for (const error of errors) log(`::error::${error}`)
  return result.ok && errors.length === 0 ? 0 : 1
}

// Not import.meta.main: Node versions that can run this file but lack it
// (22.6–22.17 with --experimental-strip-types, and 23.6–24.1) would silently
// skip the check.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = await main()
  } catch (err) {
    console.log(
      `::error::check-companion-compat failed: ${err instanceof Error ? err.message : err}`,
    )
    process.exitCode = 1
  }
}
