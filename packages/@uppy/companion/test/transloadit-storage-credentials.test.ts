import type { TransloaditStorageProviderOptions } from '../src/schemas/companion.js'
import type { CompanionLike } from '../src/server/provider/Provider.js'
import type { GrantClaims } from './fixtures/s3.js'

import { createHash, createHmac } from 'node:crypto'
import { createServer } from 'node:http'

import express from 'express'
import request from 'supertest'
import { expect, onTestFinished, test, vi } from 'vitest'
import { z } from 'zod'

import { defaultOptions } from '../src/config/companion.js'
import simpleAuth from '../src/server/controllers/simple-auth.js'
import logger from '../src/server/logger.js'
import { ProviderAuthError } from '../src/server/provider/error.js'
import { userError } from '../src/server/provider/errorCodes.js'
import { parseTransloaditStorageProviderOptions } from '../src/server/provider/s3/config.js'
import TransloaditStorageProvider from '../src/server/provider/s3/transloadit-storage.js'
import { claims, mint } from './fixtures/s3.js'

const secret = 'local-test-server-key-not-a-browser-capability'
const workspace = 'a'.repeat(32)

async function fixture(
  options: {
    wrongWorkspace?: boolean
    status?: number
    body?: unknown
    apiEndpoint?: string
    contextMode?: boolean
    staticMode?: boolean
  } = {},
) {
  const lookups: string[] = []
  const s3Keys: string[] = []
  const moves: URLSearchParams[] = []
  const contexts: { workspace: string; grant: string; context: string }[] = []
  const s3Tokens: (string | string[] | undefined)[] = []
  const server = createServer(async (request, response) => {
    if (request.url === '/internal/file-library/credentials') {
      let body = ''
      for await (const chunk of request) body += chunk
      const {
        workspace: requested,
        grant,
        context,
      } = z
        .object({
          workspace: z.string(),
          grant: z.string().optional(),
          context: z.string().optional(),
        })
        .parse(JSON.parse(body))
      if (context !== undefined && grant !== undefined)
        contexts.push({ workspace: requested, grant, context })
      lookups.push(requested)
      const authorization = request.headers.authorization ?? ''
      const [, timestamp, signature] =
        /^FileLibrary (\d+):([a-f0-9]{64})$/.exec(authorization) ?? []
      expect(signature).toBe(
        createHmac('sha256', secret)
          .update(
            context !== undefined
              ? `file-library-credentials:v2:${timestamp}:${createHash('sha256')
                  .update(JSON.stringify([requested, grant, context]))
                  .digest('hex')}`
              : `file-library-credentials:v1:${timestamp}:${requested}`,
          )
          .digest('hex'),
      )
      response.writeHead(options.status ?? 200, {
        'content-type': 'application/json',
      })
      response.end(
        JSON.stringify(
          options.body ?? {
            workspace: options.wrongWorkspace ? 'c'.repeat(32) : requested,
            authKey: `key-${requested}`,
            authSecret: 'local-workspace-secret',
            ...(options.contextMode &&
              context !== undefined && {
                sessionToken: `session-token:${context}`,
              }),
          },
        ),
      )
      return
    }
    if (request.url === '/dam/entries/move') {
      let body = ''
      for await (const chunk of request) body += chunk
      const form = new URLSearchParams(body)
      moves.push(form)
      const { destination } = JSON.parse(form.get('params') ?? '{}')
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(
        JSON.stringify({
          ok: 'DAM_ENTRY_MOVED',
          path: destination.normalize('NFC'),
        }),
      )
      return
    }
    s3Keys.push(request.headers.authorization ?? '')
    s3Tokens.push(request.headers['x-amz-security-token'])
    response.writeHead(200, { 'content-type': 'application/xml' })
    response.end(
      '<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><IsTruncated>false</IsTruncated><KeyCount>0</KeyCount></ListBucketResult>',
    )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Expected TCP address')
  const endpoint = `http://127.0.0.1:${address.port}`
  const storageOptions = {
    // Shared provider map also describes OAuth providers; the native provider ignores this.
    key: undefined,
    grantSecret: secret,
    ...(options.staticMode
      ? {
          workspaces: {
            [workspace]: { key: 'static', secret: 'static-secret' },
          },
        }
      : { credentialsSecret: secret }),
    apiEndpoint: options.apiEndpoint ?? endpoint,
    endpoint,
    region: 'auto',
    forcePathStyle: true,
    // Must not inherit a universal S3 key from arbitrary client options.
    awsClientOptions: {
      credentials: {
        accessKeyId: 'wrong-key',
        secretAccessKey: 'wrong-secret',
      },
    },
  } satisfies TransloaditStorageProviderOptions & { key: undefined }
  const companion: CompanionLike = {
    options: {
      ...defaultOptions,
      secret,
      filePath: '/tmp',
      server: { ...defaultOptions.server, host: 'localhost' },
      providerOptions: { 'transloadit-storage': storageOptions },
    },
    s3ProviderClients: new Map(),
  }
  onTestFinished(async () => {
    for (const client of companion.s3ProviderClients.values()) client.destroy()
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })
  const provider = new TransloaditStorageProvider({ allowLocalUrls: true })
  const grantSession = (
    overrides: GrantClaims = {},
    storageContext?: unknown,
  ) =>
    provider.simpleAuth({
      companion,
      requestBody: {
        form: {
          grant: mint(claims({ bucket: workspace, ...overrides }), secret),
          ...(storageContext !== undefined && { storageContext }),
        },
      },
    })
  return {
    companion,
    lookups,
    s3Keys,
    moves,
    contexts,
    s3Tokens,
    provider,
    grantSession,
  }
}

test('new Workspaces need no credential map or restart and get separate S3 signing keys', async () => {
  const { provider, companion, lookups, s3Keys, grantSession } = await fixture()
  const session = await grantSession()
  expect(JSON.stringify(session)).not.toContain(secret)
  expect(JSON.stringify(session)).not.toContain('local-workspace-secret')
  await provider.list({ companion, providerUserSession: session })
  const other = await grantSession({ bucket: 'b'.repeat(32) })
  await provider.list({ companion, providerUserSession: other })
  expect(new Set(lookups)).toEqual(new Set([workspace, 'b'.repeat(32)]))
  expect(s3Keys).toEqual([
    expect.stringContaining(`Credential=key-${workspace}/`),
    expect.stringContaining(`Credential=key-${'b'.repeat(32)}/`),
  ])
})

test('does not resolve credentials for a forged grant', async () => {
  const { provider, companion, lookups } = await fixture()
  await expect(
    provider.simpleAuth({
      companion,
      requestBody: {
        form: {
          grant: mint(claims({ bucket: workspace }), 'wrong-signer'),
        },
      },
    }),
  ).rejects.toThrow()
  expect(lookups).toEqual([])
})

test('reuses unexpired credentials across S3 operations without repeated broker calls', async () => {
  const { provider, companion, lookups, s3Keys, grantSession } = await fixture()
  const session = await grantSession()
  await provider.list({ companion, providerUserSession: session })
  await provider.list({ companion, providerUserSession: session })
  expect(s3Keys).toHaveLength(2)
  expect(lookups).toEqual([workspace])
})

const outage = { name: 'ProviderApiError', statusCode: 502 }

test.each([
  [{ status: 403 }, userError('S3_REQUEST_FAILED')],
  [{ status: 401 }, outage],
  [{ wrongWorkspace: true }, outage],
  [{ status: 500 }, outage],
  [{ body: { workspace } }, outage],
  [{ apiEndpoint: 'http://127.0.0.1:1' }, outage],
])(
  'refuses credential-service denials, bad answers and outages without S3 fallback (%j)',
  async (options, expected) => {
    const { provider, companion, s3Keys, grantSession } = await fixture(options)
    const session = await grantSession()
    await expect(
      provider.list({ companion, providerUserSession: session }),
    ).rejects.toMatchObject(expected)
    expect(s3Keys).toEqual([])
  },
)

test('warns operators when the resolver rejects the server proof', async () => {
  const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
  onTestFinished(() => warn.mockRestore())
  const { provider, companion, s3Keys, grantSession } = await fixture({
    status: 401,
  })
  const session = await grantSession()
  await expect(
    provider.list({ companion, providerUserSession: session }),
  ).rejects.toMatchObject(outage)
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('credentialsSecret'),
    'provider.transloadit-storage.credentials',
  )
  expect(s3Keys).toEqual([])
})

test('refuses a Workspace that is not an ID without asking the resolver', async () => {
  const { provider, companion, lookups, s3Keys, grantSession } = await fixture()
  const session = await grantSession({ bucket: 'my-workspace' })
  await expect(
    provider.list({ companion, providerUserSession: session }),
  ).rejects.toEqual(userError('S3_INVALID_GRANT'))
  expect(lookups).toEqual([])
  expect(s3Keys).toEqual([])
})

test('signs native moves with the cached Workspace key pair', async () => {
  const { provider, companion, moves, lookups, grantSession } = await fixture()
  const session = await grantSession({ scopes: ['read', 'write'] })
  await provider.list({ companion, providerUserSession: session })
  await provider.moveItem({
    companion,
    providerUserSession: session,
    id: 'tenant-1/a.jpg',
    destination: 'tenant-1/b.jpg',
  })
  const params = moves[0]?.get('params') ?? ''
  expect(JSON.parse(params)).toMatchObject({
    auth: { key: `key-${workspace}` },
    file_library: true,
  })
  expect(moves[0]?.get('signature')).toBe(
    `sha256:${createHmac('sha256', 'local-workspace-secret').update(params).digest('hex')}`,
  ) // The move reuses the S3 client's credentials: one resolver call in total.
  expect(lookups).toEqual([workspace])
})

test('normalizes native move paths before signing and comparing the catalog response', async () => {
  const { provider, companion, moves, grantSession } = await fixture()
  const session = await grantSession({ scopes: ['read', 'write'] })
  const moved = await provider.moveItem({
    companion,
    providerUserSession: session,
    id: 'tenant-1/cafe\u0301.jpg',
    destination: 'tenant-1/renamed-cafe\u0301.jpg',
  })
  expect(JSON.parse(moves[0]?.get('params') ?? '{}')).toMatchObject({
    source: 'tenant-1/café.jpg',
    destination: 'tenant-1/renamed-café.jpg',
    file_library: true,
  })
  expect(moved).toEqual({
    id: 'tenant-1/renamed-café.jpg',
    requestPath: encodeURIComponent('tenant-1/renamed-café.jpg'),
  })
})

test.each([
  {
    workspaces: { [workspace]: { key: 'k', secret: 's' } },
    credentialsSecret: secret,
  },
  {},
])(
  'takes exactly one of workspaces or credentialsSecret (%j)',
  (credentials) => {
    expect(() =>
      parseTransloaditStorageProviderOptions({
        grantSecret: secret,
        apiEndpoint: 'https://api2.transloadit.com',
        ...credentials,
      }),
    ).toThrow('set exactly one of workspaces or credentialsSecret')
  },
)

test.each([
  ['http://api2.transloadit.com', false],
  ['https://api2.transloadit.com', true],
  ['http://localhost:3000', true],
  ['http://127.0.0.1:3000', true],
])(
  'credentialsSecret with apiEndpoint %s is accepted: %s',
  (apiEndpoint, ok) => {
    const parse = () =>
      parseTransloaditStorageProviderOptions({
        grantSecret: secret,
        credentialsSecret: secret,
        apiEndpoint,
      })
    if (ok) expect(parse).not.toThrow()
    else expect(parse).toThrow('credentialsSecret needs an https apiEndpoint')
  },
)

test('binds broker requests to the original grant and separates contexts in the same Workspace', async () => {
  const { provider, companion, contexts, s3Tokens, grantSession } =
    await fixture({ contextMode: true })
  const alice = await grantSession({ sub: 'alice' }, 'alice-context')
  const bob = await grantSession({ sub: 'bob' }, 'bob-context')
  await provider.list({ companion, providerUserSession: alice })
  await provider.list({ companion, providerUserSession: bob })
  await provider.list({ companion, providerUserSession: alice })
  expect(contexts).toEqual([
    { workspace, grant: alice.nativeContext?.grant, context: 'alice-context' },
    { workspace, grant: bob.nativeContext?.grant, context: 'bob-context' },
  ])
  expect(s3Tokens).toEqual([
    'session-token:alice-context',
    'session-token:bob-context',
    'session-token:alice-context',
  ])
  expect(companion.s3ProviderClients.size).toBe(2)
})

test('includes the broker session token in the signed native move parameters', async () => {
  const { provider, companion, moves, grantSession } = await fixture({
    contextMode: true,
  })
  const session = await grantSession(
    { scopes: ['read', 'write'] },
    'alice-context',
  )
  await provider.moveItem({
    companion,
    providerUserSession: session,
    id: 'tenant-1/a.jpg',
    destination: 'tenant-1/b.jpg',
  })
  expect(JSON.parse(moves[0]?.get('params') ?? '{}')).toMatchObject({
    storage_context: 'session-token:alice-context',
  })
})

test('context requests fail closed when the broker returns only unscoped credentials', async () => {
  const { provider, companion, grantSession, s3Keys } = await fixture()
  const session = await grantSession({}, 'alice-context')
  await expect(
    provider.list({ companion, providerUserSession: session }),
  ).rejects.toMatchObject(outage)
  expect(s3Keys).toEqual([])
})

test.each(['', 'x'.repeat(8193), 123, null])(
  'rejects malformed native context (%s)',
  async (context) => {
    const { grantSession, lookups } = await fixture()
    await expect(grantSession({}, context)).rejects.toEqual(
      userError('S3_INVALID_GRANT'),
    )
    expect(lookups).toEqual([])
  },
)

test('retires expired context clients without interrupting in-flight downloads', async () => {
  const { provider, companion, grantSession } = await fixture({
    contextMode: true,
  })
  const session = await grantSession({}, 'alice-context')
  await provider.list({ companion, providerUserSession: session })
  const client = [...companion.s3ProviderClients.values()][0]
  if (!client) throw new Error('Expected cached S3 client')
  const destroy = vi.spyOn(client, 'destroy')
  const originalNow = Date.now()
  const now = vi.spyOn(Date, 'now').mockReturnValue(originalNow + 901_000)
  onTestFinished(() => now.mockRestore())
  const fresh = await grantSession(
    { exp: Math.floor(originalNow / 1000) + 1800 },
    'new-context',
  )
  await provider.list({ companion, providerUserSession: fresh })
  expect(destroy).not.toHaveBeenCalled()
  expect(companion.s3ProviderClients.size).toBe(1)
})

test('an expired native context is rejected before cached credentials or the broker are used', async () => {
  const { provider, companion, lookups, grantSession } = await fixture({
    contextMode: true,
  })
  const session = await grantSession({}, 'alice-context')
  await provider.list({ companion, providerUserSession: session })
  const now = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 901_000)
  onTestFinished(() => now.mockRestore())
  await expect(
    provider.list({ companion, providerUserSession: session }),
  ).rejects.toBeInstanceOf(ProviderAuthError)
  expect(lookups).toHaveLength(1)
})

test('native simple-auth acknowledges context retention without returning its contents', async () => {
  const { provider, companion } = await fixture()
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    Object.assign(req, {
      id: 'context-ack-test',
      companion: {
        ...companion,
        provider,
        providerClass: TransloaditStorageProvider,
      },
    })
    next()
  })
  app.post('/:providerName/simple-auth', simpleAuth)
  const grant = mint(claims({ bucket: workspace }), secret)
  const accepted = await request(app)
    .post('/transloadit-storage/simple-auth')
    .send({ form: { grant, storageContext: 'context' } })
    .expect(200)
  expect(accepted.body).toEqual({
    uppyAuthToken: expect.any(String),
    storageContextAccepted: true,
  })
  const plain = await request(app)
    .post('/transloadit-storage/simple-auth')
    .send({ form: { grant } })
    .expect(200)
  expect(plain.body).toEqual({ uppyAuthToken: expect.any(String) })
})

test('refuses context at login when only static Workspace credentials are configured', async () => {
  const { grantSession, lookups } = await fixture({ staticMode: true })
  await expect(grantSession({}, 'context')).rejects.toEqual(
    userError('S3_INVALID_GRANT'),
  )
  expect(lookups).toEqual([])
})
