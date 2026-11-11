import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  compareVersions,
  evaluate,
  parseHostedVersion,
  parseVersion,
} from './check-companion-compat.mjs'

const url = 'https://api2.transloadit.com/companion/'
const url2 = 'https://api2-eu-west-1.transloadit.com/companion/'

describe('parseVersion / compareVersions', () => {
  it('parses x.y.z with optional prerelease and build', () => {
    assert.deepEqual(parseVersion('7.2.1'), {
      release: [7, 2, 1],
      prerelease: [],
    })
    assert.deepEqual(parseVersion('8.0.0-beta.1+abc'), {
      release: [8, 0, 0],
      prerelease: ['beta', '1'],
    })
  })

  it('compares numerically, not lexically', () => {
    assert.equal(compareVersions('7.10.0', '7.9.9'), 1)
    assert.equal(compareVersions('7.9.9', '7.10.0'), -1)
    assert.equal(compareVersions('7.0.0', '7.0.0'), 0)
  })

  it('follows semver precedence for prereleases', () => {
    const ascending = [
      '7.0.0-alpha',
      '7.0.0-alpha.1',
      '7.0.0-alpha.beta',
      '7.0.0-beta',
      '7.0.0-beta.2',
      '7.0.0-beta.11',
      '7.0.0-rc.1',
      '7.0.0',
      '7.3.0-beta.1',
    ]
    for (let i = 0; i < ascending.length - 1; i++) {
      assert.equal(compareVersions(ascending[i], ascending[i + 1]), -1)
      assert.equal(compareVersions(ascending[i + 1], ascending[i]), 1)
    }
    assert.equal(compareVersions('7.0.0+abc', '7.0.0'), 0)
  })

  it('rejects anything that is not a semver version', () => {
    for (const bad of ['7.0', 'latest', '^7.0.0', '7.0.0-', '', undefined]) {
      assert.throws(() => parseVersion(bad))
    }
  })
})

describe('parseHostedVersion', () => {
  it('reads the welcome line', () => {
    const body =
      'Welcome to Companion v7.2.1\n===================================\n'
    assert.equal(parseHostedVersion(body), '7.2.1')
  })

  it('drops a +build suffix', () => {
    assert.equal(
      parseHostedVersion('Welcome to Companion v7.2.1+abc123\n'),
      '7.2.1',
    )
  })

  it('keeps a prerelease', () => {
    assert.equal(
      parseHostedVersion('Welcome to Companion v7.3.0-beta.1+abc\n'),
      '7.3.0-beta.1',
    )
  })

  it('returns undefined for HTML or garbage', () => {
    assert.equal(
      parseHostedVersion('<html><body>502 Bad Gateway</body></html>'),
      undefined,
    )
    assert.equal(
      parseHostedVersion('<p>Welcome to Companion v7.2.1</p>'),
      undefined,
    )
    assert.equal(parseHostedVersion('hello'), undefined)
    assert.equal(parseHostedVersion(''), undefined)
  })
})

describe('evaluate', () => {
  const base = {
    min: '7.0.0',
    repoCompanion: '7.2.2',
    hosted: [
      { url, version: '7.2.1' },
      { url: url2, version: '7.2.1' },
    ],
    fieldChanged: false,
    isPullRequest: false,
  }

  it('passes when everything is new enough', () => {
    const result = evaluate(base)
    assert.equal(result.ok, true)
    assert.deepEqual(result.warnings, [])
    assert.ok(result.lines.some((line) => line.includes(url)))
    assert.ok(result.lines.some((line) => line.includes(url2)))
  })

  for (const isPullRequest of [true, false]) {
    it(`fails when one endpoint is too old (isPullRequest: ${isPullRequest})`, () => {
      const result = evaluate({
        ...base,
        isPullRequest,
        hosted: [
          { url, version: '7.2.1' },
          { url: url2, version: '6.9.0' },
        ],
      })
      assert.equal(result.ok, false)
      assert.ok(
        result.lines.some(
          (line) => line.includes(url2) && line.includes('6.9.0'),
        ),
      )
    })
  }

  it('fails when min is newer than the Companion in this repo', () => {
    const result = evaluate({ ...base, min: '7.3.0' })
    assert.equal(result.ok, false)
    assert.ok(
      result.lines.some((line) =>
        line.includes('Land and release the Companion change first'),
      ),
    )
  })

  it('fails on release when an endpoint is unreachable', () => {
    const result = evaluate({
      ...base,
      hosted: [{ url, version: undefined }],
    })
    assert.equal(result.ok, false)
  })

  it('fails on a PR that changes the field when an endpoint is unreachable', () => {
    const result = evaluate({
      ...base,
      isPullRequest: true,
      fieldChanged: true,
      hosted: [{ url, version: undefined }],
    })
    assert.equal(result.ok, false)
  })

  it('only warns on a PR that does not change the field when an endpoint is unreachable', () => {
    const result = evaluate({
      ...base,
      isPullRequest: true,
      fieldChanged: false,
      hosted: [
        { url, version: undefined },
        { url: url2, version: '7.2.1' },
      ],
    })
    assert.equal(result.ok, true)
    assert.equal(result.warnings.length, 1)
    assert.ok(result.warnings[0].includes(url))
  })

  it('accepts a hosted prerelease above the minimum', () => {
    const result = evaluate({
      ...base,
      hosted: [{ url, version: '7.3.0-beta.1' }],
    })
    assert.equal(result.ok, true)
  })

  it('fails when the minimum is a release and the repo has only its prerelease', () => {
    const result = evaluate({
      ...base,
      min: '8.0.0',
      repoCompanion: '8.0.0-beta.1',
    })
    assert.equal(result.ok, false)
  })

  describe('the #6248 incident (client 6.0.0 needed Companion 7, hosted ran 6.1.1)', () => {
    it('fails when the client needs a Companion the repo has not got yet', () => {
      const result = evaluate({ ...base, min: '7.0.0', repoCompanion: '6.2.2' })
      assert.equal(result.ok, false)
    })

    it('fails when hosted still runs the old Companion', () => {
      const result = evaluate({
        ...base,
        min: '7.0.0',
        repoCompanion: '7.0.0',
        hosted: [{ url, version: '6.1.1' }],
      })
      assert.equal(result.ok, false)
    })
  })
})
