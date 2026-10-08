import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFile, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const root = fileURLToPath(new URL('../', import.meta.url))
const exec = promisify(execFile)
const approvalEnvironment = 'oauth-client-publication'
const oauthClients = new Set([
  'uppy',
  ...(
    'core angular dashboard components remote-sources box dropbox facebook ' +
    'google-drive google-drive-picker google-photos-picker onedrive zoom react vue svelte'
  )
    .split(' ')
    .map((name) => `@uppy/${name}`),
])

export function needsVersionPullRequest(files) {
  return files.some(
    (file) =>
      file.endsWith('.md') &&
      !file.startsWith('.') &&
      !['readme.md', 'agents.md', 'claude.md', 'gemini.md'].includes(
        file.toLowerCase(),
      ),
  )
}

export function exactCdnVersion(input, localVersion) {
  const version = input || localVersion
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
    throw new Error('CDN candidate must use an exact package version')
  return version
}

export function selectPublishPlan(plan) {
  if (plan?.version !== 1 || !Array.isArray(plan.plan))
    throw new Error('Invalid Changesets publish plan')
  const entries = plan.plan.flat()
  const published = entries.filter(({ kind }) => kind === 'publish')
  return {
    entries: published,
    requiresApproval: published.some(({ name }) => oauthClients.has(name)),
    digest: createHash('sha256')
      .update(JSON.stringify(plan.plan))
      .digest('hex'),
  }
}

export async function checkEnvironment({ repo, token, fetcher = fetch }) {
  if (repo !== 'transloadit/uppy' || !token)
    throw new Error('Approval environment access is unavailable')
  const response = await fetcher(
    `https://api.github.com/repos/${repo}/environments/${approvalEnvironment}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    },
  )
  if (!response.ok)
    throw new Error(`Approval environment is unavailable (${response.status})`)
  const environment = await response.json()
  const rule = environment.protection_rules?.find(
    ({ type }) => type === 'required_reviewers',
  )
  if (!rule?.reviewers?.length)
    throw new Error('Approval environment needs required reviewers')
  if (rule.prevent_self_review !== true)
    throw new Error('Approval environment must prevent self-review')
  if (
    !environment.deployment_branch_policy?.protected_branches &&
    !environment.deployment_branch_policy?.custom_branch_policies
  )
    throw new Error('Approval environment needs a deployment branch policy')
}

export async function publishIfApproved({
  readPlan,
  publish,
  expectedDigest,
  approvalResult,
  verifyProtection,
}) {
  const selected = selectPublishPlan(await readPlan())
  if (expectedDigest && selected.digest !== expectedDigest)
    throw new Error('Changesets publish plan changed after approval preflight')
  if (selected.requiresApproval) {
    if (!expectedDigest || approvalResult !== 'success')
      throw new Error('OAuth release needs protected manual approval')
    await verifyProtection()
  }
  await publish()
}

async function readPublishPlan() {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'uppy-release-plan-'))
  try {
    const output = path.join(temporary, 'plan.json')
    await exec(
      'corepack',
      ['yarn', 'changeset', 'publish-plan', '--output', output],
      { cwd: root },
    )
    return JSON.parse(await readFile(output, 'utf8'))
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

async function releaseSha() {
  const sha = (
    await exec('git', ['rev-parse', 'HEAD'], { cwd: root })
  ).stdout.trim()
  if (sha !== process.env.GITHUB_SHA)
    throw new Error('Release checkout SHA does not match the workflow SHA')
  return sha
}

function canaryLink() {
  const value = process.env.COMPANION_OAUTH_CANARY_URL
  if (!value || new URL(value).protocol !== 'https:')
    throw new Error('A live HTTPS callback canary URL is required for approval')
  return value
}

async function verifyProtection() {
  if (process.env.GITHUB_REF !== 'refs/heads/main')
    throw new Error('OAuth-client publication requires main')
  await checkEnvironment({
    repo: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
  })
}

async function writeSummary({ title, entries, sha, approval, source }) {
  const repo = process.env.GITHUB_REPOSITORY ?? 'transloadit/uppy'
  let summary = `## ${title}

Workflow checkout: \`${sha}\`
Source: ${source}

${entries.map(({ name, version }) => `- \`${name}@${version}\``).join('\n')}
`
  if (approval)
    summary += `
### Before approving

Verify hosted Companion was rolled out first and can serve these OAuth clients; inspect regional deployment evidence and the callback canary. Reject if compatibility is unknown.

- [Uppy CI for this commit](https://github.com/${repo}/commit/${sha}/checks)
- [API2 historical client regression](https://github.com/transloadit/api2/pull/9496/checks)
- [Regional callback canary](${canaryLink()})

These links do not prove this candidate works with every hosted Companion instance. Approval is a human release decision, not an automated fleet verdict.
`
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
}

async function prepareRelease() {
  const pending = needsVersionPullRequest(
    await readdir(path.join(root, '.changeset')),
  )
  const selected = selectPublishPlan(
    pending ? { version: 1, plan: [] } : await readPublishPlan(),
  )
  const sha = await releaseSha()
  if (selected.requiresApproval) await verifyProtection()
  await writeSummary({
    title: pending ? 'Changesets version PR' : 'Changesets publication plan',
    entries: selected.entries,
    sha,
    approval: selected.requiresApproval,
    source: 'release commit',
  })
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `approval_required=${selected.requiresApproval}\nplan_digest=${selected.digest}\n`,
  )
}

async function prepareCdn() {
  const name = process.env.PACKAGE
  if (!['uppy', '@uppy/locales'].includes(name))
    throw new Error('Unsupported CDN package')
  const approval = name === 'uppy'
  if (approval) await verifyProtection()
  const packageDir = name === 'uppy' ? 'uppy' : '@uppy/locales'
  const localVersion = JSON.parse(
    await readFile(
      path.join(root, 'packages', packageDir, 'package.json'),
      'utf8',
    ),
  ).version
  const version = exactCdnVersion(process.env.VERSION, localVersion)
  const sha = await releaseSha()
  await writeSummary({
    title: 'Manual CDN upload',
    entries: [{ name, version }],
    sha,
    approval,
    source: process.env.VERSION
      ? 'npm version; workflow SHA is not npm provenance'
      : 'local build from workflow SHA',
  })
  await appendFile(process.env.GITHUB_OUTPUT, `approval_required=${approval}\n`)
}

async function publishChangesets() {
  await new Promise((resolve, reject) => {
    const env = { ...process.env }
    delete env.GITHUB_TOKEN
    const child = spawn('corepack', ['yarn', 'changeset', 'publish'], {
      cwd: root,
      stdio: 'inherit',
      env,
    })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Changesets publish exited ${code}`)),
    )
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  const actions = {
    'prepare-release': prepareRelease,
    'prepare-cdn': prepareCdn,
    'verify-protection': verifyProtection,
    publish: () =>
      publishIfApproved({
        readPlan: readPublishPlan,
        publish: publishChangesets,
        expectedDigest: process.env.EXPECTED_RELEASE_PLAN_DIGEST,
        approvalResult: process.env.RELEASE_APPROVAL_RESULT,
        verifyProtection,
      }),
  }
  Promise.resolve()
    .then(() => {
      if (!actions[mode]) throw new Error('Unknown release approval command')
      if (mode === 'publish' && process.argv.length > 3)
        throw new Error('Unsupported Changesets publish options')
      return actions[mode]()
    })
    .catch((error) => {
      console.error(`Release approval: ${error.message}`)
      process.exitCode = 1
    })
}
