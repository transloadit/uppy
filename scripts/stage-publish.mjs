#!/usr/bin/env node

/**
 * Publishes every workspace package whose version is not on the registry yet.
 *
 * Rather than publishing straight away, packages are *staged*: the tarball is
 * uploaded to npm but stays invisible until a maintainer approves it with 2FA.
 * Run `yarn release:approve` locally to do that. See
 * https://docs.npmjs.com/staged-publishing/ and RELEASE.md.
 *
 * This replaces `changeset publish`, which cannot stage yet (see
 * https://github.com/changesets/changesets/issues/2025). Packing is still done
 * by Yarn so `workspace:^` ranges get resolved exactly like `yarn npm publish`
 * does today — only the upload goes through the npm CLI, which is the only tool
 * that speaks the staging API.
 *
 * For every package it handles, this prints `New tag: <name>@<version>` and
 * creates the matching annotated git tag, because that is what
 * changesets/action greps for to push tags and create GitHub releases.
 */

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const MIN_NPM_VERSION = [11, 15, 0]

const dryRun = process.argv.includes('--dry-run')
// Escape hatch: publish directly instead of staging, i.e. what we did before.
const skipStaging = process.env.UPPY_SKIP_STAGING === 'true'

function exec(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'pipe' })
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

async function execOrThrow(command, args, options) {
  const result = await exec(command, args, options)
  if (result.code !== 0) {
    throw new Error(
      `\`${command} ${args.join(' ')}\` exited with ${result.code}\n${result.stderr || result.stdout}`,
    )
  }
  return result
}

function isAtLeast(actual, minimum) {
  for (let i = 0; i < minimum.length; i++) {
    const part = actual[i] ?? 0
    if (part !== minimum[i]) return part > minimum[i]
  }
  return true
}

async function assertNpmVersion() {
  const { stdout } = await execOrThrow('npm', ['--version'])
  const actual = stdout.trim()
  const parsed = actual.split('.').map((part) => Number.parseInt(part, 10))
  if (!isAtLeast(parsed, MIN_NPM_VERSION)) {
    throw new Error(
      `npm ${MIN_NPM_VERSION.join('.')} or newer is required for staged publishing, found ${actual}. ` +
        `Run \`npm install --global npm@latest\`, or set UPPY_SKIP_STAGING=true to publish directly.`,
    )
  }
}

async function getPublishablePackages() {
  const { stdout } = await execOrThrow('yarn', ['workspaces', 'list', '--json'])
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((workspace) => workspace.location !== '.')
    .map((workspace) => ({
      ...workspace,
      manifest: JSON.parse(
        readFileSync(path.join(workspace.location, 'package.json'), 'utf8'),
      ),
    }))
    .filter((workspace) => !workspace.manifest.private)
}

async function getRegistry() {
  const { stdout } = await execOrThrow('npm', ['config', 'get', 'registry'])
  const registry = stdout.trim()
  return registry.endsWith('/') ? registry : `${registry}/`
}

/**
 * @returns {Promise<'published' | 'missing' | 'unpublished-name'>} whether this
 * exact version is live, or if not, whether the package name exists at all.
 * Brand new names cannot be staged — npm requires the package to already exist.
 */
async function getRegistryStatus(registry, name, version) {
  const response = await fetch(
    new URL(name.replace('/', '%2F'), registry).toString(),
    { headers: { accept: 'application/vnd.npm.install-v1+json' } },
  )
  if (response.status === 404) return 'unpublished-name'
  if (!response.ok) {
    throw new Error(
      `Could not look up ${name} on ${registry}: ${response.status} ${response.statusText}`,
    )
  }
  const packument = await response.json()
  return packument.versions?.[version] ? 'published' : 'missing'
}

/** Mirrors how changesets picks a dist-tag, so prereleases don't become `latest`. */
function getDistTag(manifest, preState) {
  if (manifest.publishConfig?.tag) return manifest.publishConfig.tag
  if (preState?.mode === 'pre' && preState.tag) return preState.tag
  const prerelease = /-([0-9A-Za-z-.]+)(?:\+|$)/.exec(manifest.version)?.[1]
  const identifier = prerelease?.split('.').find((part) => !/^\d+$/.test(part))
  return identifier ?? 'latest'
}

function readPreState() {
  const preStatePath = path.join('.changeset', 'pre.json')
  if (!existsSync(preStatePath)) return null
  return JSON.parse(readFileSync(preStatePath, 'utf8'))
}

async function main() {
  if (!skipStaging) await assertNpmVersion()

  const preState = readPreState()
  const registry = await getRegistry()
  const packages = await getPublishablePackages()

  const statuses = await Promise.all(
    packages.map((pkg) =>
      getRegistryStatus(registry, pkg.name, pkg.manifest.version),
    ),
  )
  const unpublished = packages
    .map((pkg, index) => ({ ...pkg, status: statuses[index] }))
    .filter((pkg) => pkg.status !== 'published')

  if (unpublished.length === 0) {
    console.log('No unpublished packages to release.')
    return
  }

  const tarballDir = await mkdtemp(path.join(tmpdir(), 'uppy-release-'))
  const staged = []
  const failed = []

  try {
    for (const pkg of unpublished) {
      const { name, status, location } = pkg
      const { version } = pkg.manifest
      const tag = getDistTag(pkg.manifest, preState)

      // npm refuses to stage a name that has never been published, so the very
      // first release of a package has to go out the old way.
      const canStage = !skipStaging && status !== 'unpublished-name'
      if (!canStage && status === 'unpublished-name') {
        console.log(
          `! ${name}@${version} does not exist on the registry yet and cannot be staged; publishing it directly.`,
        )
      }

      console.log(
        `${canStage ? 'Staging' : 'Publishing'} ${name}@${version} (tag: ${tag})${dryRun ? ' [dry run]' : ''}`,
      )

      if (dryRun) {
        staged.push({ name, version })
        continue
      }

      let result
      if (canStage) {
        const tarball = path.join(
          tarballDir,
          `${name.replace(/[@/]/g, '-')}-${version}.tgz`,
        )
        // Pack with Yarn: it resolves `workspace:` ranges to real semver ranges,
        // which the npm CLI does not do when run per package directory.
        await execOrThrow('yarn', ['workspace', name, 'pack', '--out', tarball])
        result = await exec('npm', [
          'stage',
          'publish',
          tarball,
          '--access',
          'public',
          '--tag',
          tag,
        ])
      } else {
        result = await exec(
          'yarn',
          ['npm', 'publish', '--access', 'public', '--tag', tag],
          { cwd: location },
        )
      }

      if (result.code !== 0) {
        console.error(result.stdout)
        console.error(result.stderr)
        failed.push(`${name}@${version}`)
        continue
      }

      staged.push({ name, version })
      // changesets/action greps stdout for this to create the tag and open a
      // GitHub release. It creates the remote tag itself when `commitMode` is
      // `github-api`, so a local tag that already exists is not worth failing a
      // release over.
      const tagResult = await exec('git', [
        'tag',
        `${name}@${version}`,
        '-m',
        `${name}@${version}`,
      ])
      if (tagResult.code !== 0) {
        console.warn(
          `Could not create local git tag: ${tagResult.stderr.trim()}`,
        )
      }
      console.log(`New tag: ${name}@${version}`)
    }
  } finally {
    await rm(tarballDir, { recursive: true, force: true })
  }

  if (staged.length > 0 && !skipStaging) {
    console.log(
      `\n${staged.length} package(s) staged. They are NOT live yet — run \`yarn release:approve\` to approve them with 2FA.`,
    )
  }

  if (failed.length > 0) {
    console.error(`\nFailed to publish: ${failed.join(', ')}`)
    process.exitCode = 1
  }
}

try {
  await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
