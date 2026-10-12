import { createHmac } from 'node:crypto'
import { createServer } from 'node:http'
import { expect, onTestFinished, test } from 'vitest'
import { defaultOptions } from '../src/config/companion.js'
import type { TransloaditStorageProviderOptions } from '../src/schemas/companion.js'
import type { CompanionLike } from '../src/server/provider/Provider.js'
import TransloaditStorageProvider from '../src/server/provider/s3/transloadit-storage.js'
import { claims, mint } from './fixtures/s3.js'

const secret = 'local-test-server-key-not-a-browser-capability'
const workspace = 'a'.repeat(32)

async function fixture(
  options: { wrongWorkspace?: boolean; status?: number } = {},
) {
  const lookups: string[] = []
  const s3Keys: string[] = []
  const server = createServer(async (request, response) => {
    if (request.url === '/internal/file-library/credentials') {
      let body = ''
      for await (const chunk of request) body += chunk
      const { workspace: requested } = JSON.parse(body)
      lookups.push(requested)
      const authorization = request.headers.authorization ?? ''
      const [, timestamp, signature] =
        /^FileLibrary (\d+):([a-f0-9]{64})$/.exec(authorization) ?? []
      expect(signature).toBe(
        createHmac('sha256', secret)
          .update(`file-library-credentials:v1:${timestamp}:${requested}`)
          .digest('hex'),
      )
      response.writeHead(options.status ?? 200, {
        'content-type': 'application/json',
      })
      response.end(
        JSON.stringify({
          workspace: options.wrongWorkspace ? 'c'.repeat(32) : requested,
          authKey: `key-${requested}`,
          authSecret: 'local-workspace-secret',
        }),
      )
      return
    }
    s3Keys.push(request.headers.authorization ?? '')
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
    credentialsSecret: secret,
    apiEndpoint: endpoint,
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
  return {
    companion,
    lookups,
    s3Keys,
    provider: new TransloaditStorageProvider({ allowLocalUrls: true }),
  }
}

test('new Workspaces need no credential map or restart and get separate S3 signing keys', async () => {
  const { provider, companion, lookups, s3Keys } = await fixture()
  const session = await provider.simpleAuth({
    companion,
    requestBody: {
      form: { grant: mint(claims({ bucket: workspace }), secret) },
    },
  })
  expect(JSON.stringify(session)).not.toContain(secret)
  expect(JSON.stringify(session)).not.toContain('local-workspace-secret')
  await provider.list({ companion, providerUserSession: session })
  const other = await provider.simpleAuth({
    companion,
    requestBody: {
      form: { grant: mint(claims({ bucket: 'b'.repeat(32) }), secret) },
    },
  })
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
  const { provider, companion, lookups, s3Keys } = await fixture()
  const session = await provider.simpleAuth({
    companion,
    requestBody: {
      form: { grant: mint(claims({ bucket: workspace }), secret) },
    },
  })
  await provider.list({ companion, providerUserSession: session })
  await provider.list({ companion, providerUserSession: session })
  expect(s3Keys).toHaveLength(2)
  expect(lookups).toEqual([workspace])
})

test.each([
  { wrongWorkspace: true },
  { status: 403 },
  { status: 500 },
])('refuses credential-service denials or wrong Workspace without S3 fallback (%j)', async (options) => {
  const { provider, companion, s3Keys } = await fixture(options)
  const session = await provider.simpleAuth({
    companion,
    requestBody: {
      form: {
        grant: mint(claims({ bucket: workspace }), secret),
      },
    },
  })
  await expect(
    provider.list({ companion, providerUserSession: session }),
  ).rejects.toThrow()
  expect(s3Keys).toEqual([])
})
