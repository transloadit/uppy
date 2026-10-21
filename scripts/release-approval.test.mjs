import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  checkEnvironment,
  exactCdnVersion,
  needsVersionPullRequest,
  publishIfApproved,
  selectPublishPlan,
} from './release-approval.mjs'

const plan = (...entries) => ({ version: 1, plan: [entries] })
const release = (name) => ({ kind: 'publish', name, version: '1.2.3' })

test('a mixed batch stops before its first npm publish without approval', async () => {
  const candidate = plan(release('@uppy/locales'), release('@uppy/dropbox'))
  const selected = selectPublishPlan(candidate)
  assert.equal(selected.requiresApproval, true)
  assert.deepEqual(
    selected.entries.map(({ name, version }) => `${name}@${version}`),
    ['@uppy/locales@1.2.3', '@uppy/dropbox@1.2.3'],
  )
  let publishes = 0
  await assert.rejects(
    publishIfApproved({
      readPlan: async () => candidate,
      publish: async () => publishes++,
      expectedDigest: selected.digest,
      approvalResult: 'skipped',
      verifyProtection: async () => {},
    }),
    /approval/i,
  )
  assert.equal(publishes, 0)
})

test('approval only permits the same publish plan', async () => {
  const candidate = plan(release('@uppy/dropbox'))
  let publishes = 0
  let protectionChecks = 0
  const options = {
    readPlan: async () => candidate,
    publish: async () => publishes++,
    expectedDigest: selectPublishPlan(candidate).digest,
    approvalResult: 'success',
    verifyProtection: async () => protectionChecks++,
  }
  await publishIfApproved(options)
  assert.equal(publishes, 1)
  assert.equal(protectionChecks, 1)
  await assert.rejects(
    publishIfApproved({
      ...options,
      readPlan: async () => plan(release('uppy')),
    }),
    /changed/i,
  )
  assert.equal(publishes, 1)
})

test('unrelated releases pass; Google picker OAuth releases need approval', async () => {
  const candidate = plan(release('@uppy/companion'), release('@uppy/locales'))
  let publishes = 0
  await publishIfApproved({
    readPlan: async () => candidate,
    publish: async () => publishes++,
    approvalResult: 'skipped',
    verifyProtection: () => assert.fail('Unrelated release checked protection'),
  })
  assert.equal(publishes, 1)
  for (const name of [
    '@uppy/angular',
    '@uppy/google-drive-picker',
    '@uppy/google-photos-picker',
  ]) {
    assert.equal(selectPublishPlan(plan(release(name))).requiresApproval, true)
  }
})

test('an absent or unprotected GitHub environment cannot approve', async () => {
  assert.equal(needsVersionPullRequest(['client-change.md']), true)
  assert.throws(() => exactCdnVersion('latest', '1.2.3'), /exact/i)
  const check = (protection_rules, status = 200, branchPolicy = true) =>
    checkEnvironment({
      repo: 'transloadit/uppy',
      token: 'test-token',
      fetcher: async () => ({
        ok: status === 200,
        status,
        json: async () => ({
          protection_rules,
          deployment_branch_policy: { protected_branches: branchPolicy },
        }),
      }),
    })
  await assert.rejects(check([], 404), /environment/i)
  await assert.rejects(check([]), /reviewer/i)
  const rule = { type: 'required_reviewers', reviewers: [{ type: 'User' }] }
  await assert.rejects(
    check([{ ...rule, prevent_self_review: false }]),
    /self-review/i,
  )
  await assert.rejects(
    check([{ ...rule, prevent_self_review: true }], 200, false),
    /branch/i,
  )
  await check([{ ...rule, prevent_self_review: true }])
})
