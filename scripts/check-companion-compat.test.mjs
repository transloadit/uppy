import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { pathToFileURL } from 'node:url'
import {
  CLIENT_PATHS,
  compareVersions,
  evaluate,
  fetchHosted,
  fetchVersion,
  main,
  OPT_OUT_MARKER,
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

// A stand-in for hosted Companion:
//   /v/<version>             welcome line for <version>
//   /flaky/<n>/<version>     HTTP 502 for the first <n> requests, then /v/
//   /html                    a page without the welcome line
//   /api/<body>/repos/...    the GitHub API, a PR with description <body>
//   anything else            HTTP 502
let stub
let origin
const hits = new Map()
before(async () => {
  stub = http.createServer((req, res) => {
    hits.set(req.url, (hits.get(req.url) ?? 0) + 1)
    // A ?query only keeps the hit counts of different tests apart.
    let [, kind, ...rest] = req.url.replace(/\?.*/, '').split('/')
    if (kind === 'flaky' && hits.get(req.url) > Number(rest[0])) {
      kind = 'v'
      rest = rest.slice(1)
    }
    if (kind === 'v') res.end(`Welcome to Companion v${rest[0]}\n===\n`)
    else if (kind === 'html') res.end('<html>hi</html>')
    else if (kind === 'api' && rest[0] !== 'down') {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ body: decodeURIComponent(rest[0]) }))
    } else {
      res.statusCode = 502
      res.end()
    }
  })
  await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${stub.address().port}`
})
after(() => stub.close())

describe('fetchVersion', () => {
  it('reads the version', async () => {
    assert.deepEqual(await fetchVersion(`${origin}/v/7.2.1`), {
      version: '7.2.1',
    })
  })

  it('reports the HTTP status', async () => {
    assert.deepEqual(await fetchVersion(`${origin}/down`), {
      error: 'HTTP 502 Bad Gateway',
    })
    assert.deepEqual(await fetchVersion(`${origin}/html`), {
      error: 'HTTP 200 without a welcome line',
    })
  })

  it('reports a connection error', async () => {
    const closed = http.createServer()
    await new Promise((resolve) => closed.listen(0, '127.0.0.1', resolve))
    const { port } = closed.address()
    await new Promise((resolve) => closed.close(resolve))
    const { error } = await fetchVersion(`http://127.0.0.1:${port}/`)
    assert.match(error, /ECONNREFUSED/)
  })
})

describe('fetchHosted', () => {
  it('retries only the endpoints it could not read', async () => {
    const steady = `${origin}/v/7.2.1?steady`
    const flaky = `${origin}/flaky/2/7.2.2`
    const hosted = await fetchHosted([steady, flaky], { delayMs: 0 })
    assert.deepEqual(hosted, [
      { url: steady, version: '7.2.1' },
      { url: flaky, version: '7.2.2' },
    ])
    assert.equal(hits.get('/v/7.2.1?steady'), 1)
    assert.equal(hits.get('/flaky/2/7.2.2'), 3)
  })

  it('gives up after the last retry', async () => {
    const down = `${origin}/down?gives-up`
    const hosted = await fetchHosted([down], { retries: 2, delayMs: 0 })
    assert.deepEqual(hosted, [{ url: down, error: 'HTTP 502 Bad Gateway' }])
    assert.equal(hits.get('/down?gives-up'), 3)
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
  }

  it('passes when everything is new enough', () => {
    const result = evaluate(base)
    assert.equal(result.ok, true)
    assert.deepEqual(result.warnings, [])
    assert.ok(result.lines.some((line) => line.includes(url)))
    assert.ok(result.lines.some((line) => line.includes(url2)))
  })

  it('fails when one endpoint is too old', () => {
    const result = evaluate({
      ...base,
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

  it('fails when min is newer than the Companion in this repo', () => {
    const result = evaluate({ ...base, min: '7.3.0' })
    assert.equal(result.ok, false)
    assert.ok(
      result.lines.some((line) =>
        line.includes('Land and release the Companion change first'),
      ),
    )
  })

  it('fails when an endpoint is unreachable, saying why', () => {
    const result = evaluate({
      ...base,
      hosted: [{ url, error: 'HTTP 502 Bad Gateway' }],
    })
    assert.equal(result.ok, false)
    assert.ok(result.lines.some((line) => line.includes('HTTP 502')))
  })

  it('only warns when not strict', () => {
    const result = evaluate({
      ...base,
      strict: false,
      min: '7.3.0',
      hosted: [
        { url, error: 'HTTP 502 Bad Gateway' },
        { url: url2, version: '7.2.1' },
      ],
    })
    assert.equal(result.ok, true)
    assert.equal(result.warnings.length, 3)
    assert.ok(result.warnings.some((warning) => warning.includes(url)))
    assert.ok(result.warnings.some((warning) => warning.includes(url2)))
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

// A throwaway git repository with a `base` commit and a `head` commit on top,
// like the merge commit a PR checkout gets. Both map paths to file contents
// (objects are written as JSON); `head` only lists what it changes.
function makeRepo(base, head = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'companion-compat-'))
  const run = (...args) =>
    execFileSync(
      'git',
      ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args],
      {
        cwd: dir,
        stdio: 'ignore',
      },
    )
  const write = (files) => {
    for (const [file, content] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
      writeFileSync(
        path.join(dir, file),
        typeof content === 'string' ? content : JSON.stringify(content),
      )
    }
    run('add', '--all')
    run('commit', '--quiet', '--allow-empty', '-m', 'commit')
  }
  run('init', '--quiet')
  write(base)
  write(head)
  after(() => rmSync(dir, { recursive: true, force: true }))
  return pathToFileURL(`${dir}/`)
}

const withMinimum = (name, min, extra = {}) => ({
  [`packages/${name}/package.json`]: {
    name,
    ...extra,
    uppy: { minCompanionVersion: min },
  },
})
const corePackage = (min) => withMinimum('@uppy/core', min)
const repoFiles = {
  ...corePackage('7.0.0'),
  'packages/@uppy/companion/package.json': {
    name: '@uppy/companion',
    version: '7.2.2',
  },
}

async function runMain({ root, argv = [], env = {}, endpoints }) {
  const lines = []
  const code = await main({
    argv,
    root,
    env,
    endpoints,
    retryDelayMs: 0,
    log: (line) => lines.push(line),
  })
  return {
    code,
    lines,
    warnings: lines.filter((line) => line.startsWith('::warning::')),
  }
}

describe('main', () => {
  const pr = { argv: ['--ci'], env: { GITHUB_EVENT_NAME: 'pull_request' } }
  // A PR event whose payload has the description `payloadBody` and whose
  // current description, from the API, is `apiBody` (undefined: API down).
  const prWith = ({ payloadBody, apiBody }) => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'companion-compat-event-'))
    after(() => rmSync(dir, { recursive: true, force: true }))
    const eventPath = path.join(dir, 'event.json')
    writeFileSync(
      eventPath,
      JSON.stringify({ pull_request: { number: 7, body: payloadBody } }),
    )
    return {
      ...pr,
      env: {
        ...pr.env,
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_API_URL: `${origin}/api/${apiBody === undefined ? 'down' : encodeURIComponent(apiBody)}`,
        GITHUB_REPOSITORY: 'o/r',
      },
    }
  }
  const optOut = 'Fixes a typo.\r\n\r\ncompanion-compat: none\r\n'
  const push = { argv: ['--ci'], env: { GITHUB_EVENT_NAME: 'push' } }

  it('passes when every endpoint is new enough', async () => {
    const root = makeRepo(repoFiles)
    const result = await runMain({ root, endpoints: [`${origin}/v/7.2.1`] })
    assert.equal(result.code, 0)
  })

  it('uses the highest minimum of the published packages', async () => {
    const root = makeRepo({
      ...repoFiles,
      ...withMinimum('@uppy/s3', '7.1.0'),
      ...withMinimum('@uppy/private', '9.0.0', { private: true }),
      ...withMinimum('uppy', '6.0.0'),
    })
    const result = await runMain({ root, endpoints: [`${origin}/v/7.0.5`] })
    assert.equal(result.code, 1)
    assert.ok(
      result.lines.includes('minCompanionVersion 7.1.0 (from @uppy/s3)'),
    )
  })

  it('treats a changed minimum in any package as a changed minimum', async () => {
    const root = makeRepo(
      { ...repoFiles, ...withMinimum('@uppy/s3', '7.1.0') },
      withMinimum('@uppy/s3', '7.0.0'),
    )
    const result = await runMain({
      root,
      ...pr,
      endpoints: [`${origin}/down?s3-changed`],
    })
    assert.equal(result.code, 1)
  })

  it('fails outside a PR when an endpoint is too old', async () => {
    const root = makeRepo(repoFiles)
    const result = await runMain({
      root,
      endpoints: [`${origin}/v/7.2.1`, `${origin}/v/6.9.0`],
    })
    assert.equal(result.code, 1)
  })

  it('reads the endpoints from COMPANION_COMPAT_ENDPOINTS', async () => {
    const root = makeRepo(repoFiles)
    const result = await runMain({
      root,
      env: { COMPANION_COMPAT_ENDPOINTS: `${origin}/v/6.9.0` },
    })
    assert.equal(result.code, 1)
    assert.ok(result.lines.some((line) => line.includes('6.9.0')))
  })

  it('only warns about an unreachable endpoint on a PR that keeps the minimum', async () => {
    const root = makeRepo(repoFiles, { 'README.md': 'docs' })
    const result = await runMain({
      root,
      ...pr,
      endpoints: [`${origin}/down?pr-keeps`],
    })
    assert.equal(result.code, 0)
    assert.equal(result.warnings.length, 1)
    assert.match(result.warnings[0], /HTTP 502/)
  })

  it('fails on an unreachable endpoint on a PR that raises the minimum', async () => {
    const root = makeRepo(repoFiles, corePackage('7.1.0'))
    const result = await runMain({
      root,
      ...pr,
      endpoints: [`${origin}/v/7.2.1`, `${origin}/down?pr-raises`],
    })
    assert.equal(result.code, 1)
  })

  it('only warns on a push', async () => {
    const root = makeRepo(repoFiles, corePackage('7.1.0'))
    const result = await runMain({
      root,
      ...push,
      endpoints: [`${origin}/v/6.9.0`, `${origin}/down?push`],
    })
    assert.equal(result.code, 0)
    assert.equal(result.warnings.length, 2)
  })

  it('fails without --ci, even in a PR', async () => {
    const root = makeRepo(repoFiles, { 'README.md': 'docs' })
    const result = await runMain({
      root,
      env: pr.env,
      endpoints: [`${origin}/down?no-ci`],
    })
    assert.equal(result.code, 1)
  })

  for (const dir of CLIENT_PATHS) {
    it(`is strict on a PR that touches ${dir}`, async () => {
      const root = makeRepo(repoFiles, { [`${dir}index.ts`]: 'x' })
      const result = await runMain({
        root,
        ...prWith({ apiBody: optOut }),
        endpoints: [`${origin}/down?touches-${dir}`],
      })
      assert.equal(result.code, 1)
      assert.ok(result.lines.some((line) => line.startsWith('FAIL')))
    })

    it(`fails on a PR that touches ${dir} but no minimum, without the marker`, async () => {
      const root = makeRepo(repoFiles, { [`${dir}index.ts`]: 'x' })
      const result = await runMain({
        root,
        ...prWith({ payloadBody: 'Fixes a typo.', apiBody: 'Fixes a typo.' }),
        endpoints: [`${origin}/v/7.2.1`],
      })
      assert.equal(result.code, 1)
      const errors = result.lines.filter((line) => line.startsWith('::error::'))
      assert.equal(errors.length, 1)
      assert.ok(errors[0].includes(dir))
      assert.ok(errors[0].includes(OPT_OUT_MARKER))
    })
  }

  it('accepts a client change that raises the minimum', async () => {
    const root = makeRepo(repoFiles, {
      ...corePackage('7.1.0'),
      'packages/@uppy/core/src/provider-views/index.ts': 'x',
    })
    const result = await runMain({
      root,
      ...pr,
      endpoints: [`${origin}/v/7.2.1`],
    })
    assert.equal(result.code, 0)
  })

  it('accepts a client change whose current description opts out', async () => {
    const root = makeRepo(repoFiles, {
      'packages/@uppy/core/src/provider-views/index.ts': 'x',
    })
    const result = await runMain({
      root,
      ...prWith({ payloadBody: 'Fixes a typo.', apiBody: optOut }),
      endpoints: [`${origin}/v/7.2.1`],
    })
    assert.equal(result.code, 0)
  })

  it('falls back to the event payload when the API is down', async () => {
    const root = makeRepo(repoFiles, {
      'packages/@uppy/core/src/provider-views/index.ts': 'x',
    })
    const result = await runMain({
      root,
      ...prWith({ payloadBody: optOut }),
      endpoints: [`${origin}/v/7.2.1`],
    })
    assert.equal(result.code, 0)
  })

  it('does not take the marker from the middle of a line', async () => {
    const root = makeRepo(repoFiles, {
      'packages/@uppy/core/src/provider-views/index.ts': 'x',
    })
    const body = 'I did not add companion-compat: none here'
    const result = await runMain({
      root,
      ...prWith({ payloadBody: body, apiBody: body }),
      endpoints: [`${origin}/v/7.2.1`],
    })
    assert.equal(result.code, 1)
  })
})
