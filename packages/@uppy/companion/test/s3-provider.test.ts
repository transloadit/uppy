import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { signParamsSync } from '@transloadit/utils/node'
import jwt from 'jsonwebtoken'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import {
  ProviderAuthError,
  ProviderUserError,
} from '../dist/server/provider/error.js'
import S3Provider, {
  TransloaditStorageProvider,
} from '../dist/server/provider/s3/index.js'

const makeProvider = (send: (cmd: unknown) => Promise<unknown> = vi.fn()) => {
  const provider = new S3Provider({ allowLocalUrls: false })
  // A real S3Client prototype: the SDK paginator insists on `instanceof`.
  const client = Object.assign(Object.create(S3Client.prototype), { send })
  vi.spyOn(provider, 'getClient').mockReturnValue(client as never)
  return provider
}

const companionWith = (
  browsableBuckets?: string[],
  mutableBuckets?: string[],
  extra: {
    acl?: 'private'
    awsSse?: 'aws:kms'
    awsSseKmsKeyId?: string
    grantSecret?: string
    allowBucketAuth?: boolean
    transloaditStorage?: {
      apiEndpoint: string
      workspaces: Record<string, { key: string; secret: string }>
    }
  } = {},
) =>
  ({
    options: { s3: { browsableBuckets, mutableBuckets, ...extra } },
  }) as never

const GRANT_SECRET = 'grant-secret-for-tests'
const mintGrant = (
  claims: Partial<Record<string, unknown>> = {},
  secret = GRANT_SECRET,
) =>
  jwt.sign(
    {
      v: 1,
      bucket: 'b',
      prefix: 'tenant/',
      scopes: ['read', 'write'],
      sub: 'user-1',
      ...claims,
    },
    secret,
    {
      algorithm: 'HS256',
      ...(claims['exp'] === undefined && { expiresIn: 900 }),
    },
  )

const notFound = () =>
  new NotFound({ message: 'NotFound', $metadata: { httpStatusCode: 404 } })

type Cmd = { input: Record<string, unknown> }
const inputsOf = (send: ReturnType<typeof vi.fn>, type: unknown) =>
  send.mock.calls
    .map((c) => c[0])
    .filter((cmd) => cmd instanceof (type as never))
    .map((cmd) => (cmd as unknown as Cmd).input)

describe('S3 provider', () => {
  test.each([
    { mutableBuckets: [] },
    { mutableBuckets: ['b'] },
  ])('listing reports effective server mutation capability (%j)', async ({
    mutableBuckets,
  }) => {
    const provider = makeProvider(async () => ({ Contents: [] }))
    const result = await provider.list({
      companion: companionWith(['b'], mutableBuckets),
      providerUserSession: {
        bucket: 'b',
        prefix: '',
        scopes: ['read', 'write'],
      },
    })
    expect(result).toHaveProperty('canMutate', mutableBuckets.includes('b'))
    const readonly = await provider.list({
      companion: companionWith(['b'], ['b']),
      providerUserSession: { bucket: 'b', prefix: '', scopes: ['read'] },
    })
    expect(readonly).toHaveProperty('canMutate', false)
  })

  test('a source replaced after copying is preserved instead of being deleted', async () => {
    let source = 'original'
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        if (command.input.Key === 'source.txt')
          return { ContentLength: 1, ETag: 'original' }
        throw notFound()
      }
      if (command instanceof CopyObjectCommand) source = 'replacement'
      if (command instanceof DeleteObjectCommand) {
        if (command.input.IfMatch && command.input.IfMatch !== source)
          throw Object.assign(new Error('PreconditionFailed'), {
            $metadata: { httpStatusCode: 412 },
          })
        source = ''
      }
      return {}
    })
    const provider = makeProvider(send)
    await expect(
      provider.moveItem({
        companion: companionWith(['b'], ['b']),
        providerUserSession: { bucket: 'b', prefix: '' },
        id: 'source.txt',
        destination: 'target.txt',
      }),
    ).rejects.toThrow()
    expect(source).toBe('replacement')
  })
  test('concurrent moves cannot replace an occupied destination or delete the losing source', async () => {
    const objects = new Map([
      ['a.txt', 'a'],
      ['b.txt', 'b'],
    ])
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        if (!objects.has(command.input.Key ?? '')) throw notFound()
        return { ContentLength: 1, ETag: 'source-etag' }
      }
      if (command instanceof CopyObjectCommand) {
        const key = command.input.Key ?? ''
        if (command.input.IfNoneMatch === '*' && objects.has(key))
          throw Object.assign(new Error('PreconditionFailed'), {
            $metadata: { httpStatusCode: 412 },
          })
        const source = (command.input.CopySource ?? '').replace('/b/', '')
        objects.set(key, objects.get(source) ?? '')
      }
      if (command instanceof DeleteObjectCommand)
        objects.delete(command.input.Key ?? '')
      return {}
    })
    const provider = makeProvider(send)
    const args = {
      companion: companionWith(['b'], ['b']),
      destination: 'target.txt',
      providerUserSession: { bucket: 'b', prefix: '' },
    }
    const results = await Promise.allSettled([
      provider.moveItem({ ...args, id: 'a.txt' }),
      provider.moveItem({ ...args, id: 'b.txt' }),
    ])
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    expect([...objects.values()].sort()).toEqual(['a', 'b'])
  })

  test('native Storage requires a grant even when no grant secret was configured', async () => {
    const provider = new TransloaditStorageProvider({ allowLocalUrls: false })
    await expect(
      provider.simpleAuth({
        companion: companionWith(['b'], ['b']),
        requestBody: { form: { bucket: 'b' } },
      }),
    ).rejects.toBeInstanceOf(ProviderUserError)
    expect(
      await provider.simpleAuth({
        companion: companionWith(['b'], ['b'], { allowBucketAuth: true }),
        requestBody: { form: { bucket: 'b' } },
      }),
    ).toMatchObject({ bucket: 'b' })
  })

  test('copy and folder creation honor configured encryption and ACL policy', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (
        command instanceof HeadObjectCommand &&
        command.input.Key !== 'source.txt'
      )
        throw notFound()
      return { ContentLength: 1, ETag: 'source-etag' }
    })
    const provider = makeProvider(send)
    const args = {
      companion: companionWith(['b'], ['b'], {
        acl: 'private',
        awsSse: 'aws:kms',
        awsSseKmsKeyId: 'test-kms-key',
      }),
      providerUserSession: { bucket: 'b', prefix: '' },
    }
    await provider.moveItem({
      ...args,
      id: 'source.txt',
      destination: 'target.txt',
    })
    await provider.createFolder({ ...args, parentId: null, name: 'folder' })
    const policy = {
      ACL: 'private',
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: 'test-kms-key',
    }
    expect(inputsOf(send, CopyObjectCommand)[0]).toMatchObject(policy)
    expect(inputsOf(send, PutObjectCommand)[0]).toMatchObject(policy)
  })

  test('rejects files above the single-copy limit before any mutation', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        if (command.input.Key === 'large.mp4')
          return { ContentLength: 6 * 1024 ** 3 }
        throw notFound()
      }
      return {}
    })
    const provider = makeProvider(send)
    await expect(
      provider.moveItem({
        companion: companionWith(['b'], ['b']),
        providerUserSession: { bucket: 'b', prefix: '' },
        id: 'large.mp4',
        destination: 'copy.mp4',
      }),
    ).rejects.toBeInstanceOf(ProviderUserError)
    expect(inputsOf(send, CopyObjectCommand)).toEqual([])
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([])
  })
  test('Storage sends one signed native move, for files and whole folders, using the granted Workspace key', async () => {
    const requests: { url: string | undefined; body: URLSearchParams }[] = []
    const server = createServer(async (request, response) => {
      let body = ''
      for await (const chunk of request) body += chunk
      requests.push({ url: request.url, body: new URLSearchParams(body) })
      const params = JSON.parse(requests.at(-1)!.body.get('params')!)
      response.setHeader('Content-Type', 'application/json')
      response.end(
        JSON.stringify({ ok: 'DAM_ENTRY_MOVED', path: params.destination }),
      )
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    onTestFinished(
      () =>
        new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        ),
    )
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Expected a TCP test server')
    const companion = companionWith(['b'], ['b'], {
      transloaditStorage: {
        apiEndpoint: `http://127.0.0.1:${address.port}`,
        workspaces: {
          b: { key: 'workspace-b-key', secret: 'workspace-b-secret' },
        },
      },
    })
    const provider = new TransloaditStorageProvider({ allowLocalUrls: true })
    const send = vi.fn()
    vi.spyOn(provider, 'getClient').mockReturnValue(
      Object.assign(Object.create(S3Client.prototype), { send }),
    )
    const providerUserSession = {
      bucket: 'b',
      prefix: 'tenant/',
      scopes: ['read', 'write'] as const,
    }
    await expect(
      provider.moveItem({
        companion,
        providerUserSession: {
          ...providerUserSession,
          scopes: ['read', 'write'],
        },
        id: 'tenant/photo.jpg',
        destination: 'tenant/renamed.jpg',
      }),
    ).resolves.toEqual({
      id: 'tenant/renamed.jpg',
      requestPath: 'tenant%2Frenamed.jpg',
    })
    await provider.moveItem({
      companion,
      providerUserSession: {
        ...providerUserSession,
        scopes: ['read', 'write'],
      },
      id: 'tenant/album/',
      destination: 'tenant/archive/',
    })
    expect(requests).toHaveLength(2)
    expect(requests[0]?.url).toBe('/dam/entries/move')
    const params = requests[0]?.body.get('params')
    if (!params) throw new Error('Expected signed native move params')
    expect(JSON.parse(params)).toMatchObject({
      auth: { key: 'workspace-b-key' },
      source: 'tenant/photo.jpg',
      destination: 'tenant/renamed.jpg',
    })
    expect(requests[0]?.body.get('signature')).toBe(
      signParamsSync(params, 'workspace-b-secret', 'sha256'),
    )
    expect(send).not.toHaveBeenCalled()
    await expect(
      provider.moveItem({
        companion,
        providerUserSession: {
          bucket: 'b',
          prefix: 'tenant/',
          scopes: ['read'],
        },
        id: 'tenant/photo.jpg',
        destination: 'tenant/new.jpg',
      }),
    ).rejects.toThrow(ProviderUserError)
    await expect(
      provider.moveItem({
        companion,
        providerUserSession: { bucket: 'b', prefix: 'tenant/', exp: 1 },
        id: 'tenant/photo.jpg',
        destination: 'tenant/new.jpg',
      }),
    ).rejects.toThrow(ProviderAuthError)
    await expect(
      provider.moveItem({
        companion,
        providerUserSession: { bucket: 'b', prefix: 'tenant/' },
        id: 'tenant/photo.jpg',
        destination: 'another/new.jpg',
      }),
    ).rejects.toThrow(ProviderUserError)
    expect(requests).toHaveLength(2)
  })
  test('Storage refuses a Workspace without matching server-side credentials', async () => {
    const provider = new TransloaditStorageProvider({ allowLocalUrls: false })
    await expect(
      provider.moveItem({
        companion: companionWith(['*'], ['*']),
        providerUserSession: {
          bucket: 'someone-else',
          prefix: '',
          scopes: ['read', 'write'],
        },
        id: 'photo.jpg',
        destination: 'renamed.jpg',
      }),
    ).rejects.toMatchObject({
      json: { message: expect.stringContaining('Workspace') },
    })
  })

  test('Storage never falls back to S3 copy/delete when native management is unavailable', async () => {
    const provider = new TransloaditStorageProvider({ allowLocalUrls: false })
    const send = vi.fn()
    vi.spyOn(provider, 'getClient').mockReturnValue(
      Object.assign(Object.create(S3Client.prototype), { send }),
    )
    await expect(
      provider.moveItem({
        companion: companionWith(['b'], ['b']),
        providerUserSession: {
          bucket: 'b',
          prefix: 'tenant/',
          scopes: ['read', 'write'],
        },
        id: 'tenant/photo.jpg',
        destination: 'tenant/new.jpg',
      }),
    ).rejects.toMatchObject({
      json: { message: expect.stringContaining('Workspace') },
    })
    expect(send).not.toHaveBeenCalled()
  })
  test('simpleAuth parses "bucket", "bucket/prefix" and "s3://bucket/prefix"', async () => {
    const provider = makeProvider()
    const auth1 = await provider.simpleAuth({
      requestBody: { form: { bucket: 'my-bucket' } },
    })
    expect(auth1).toMatchObject({ bucket: 'my-bucket', prefix: '' })

    const auth2 = await provider.simpleAuth({
      requestBody: { form: { bucket: 's3://my-bucket/some/prefix' } },
    })
    expect(auth2).toMatchObject({ bucket: 'my-bucket', prefix: 'some/prefix/' })
    await expect(
      provider.simpleAuth({ requestBody: { form: { bucket: '  ' } } }),
    ).rejects.toThrow(ProviderUserError)
  })

  test('list maps folders and files, skips the placeholder object and paginates', async () => {
    const send = vi.fn(async () => ({
      CommonPrefixes: [{ Prefix: 'blog/sub/' }],
      Contents: [
        { Key: 'blog/' },
        {
          Key: 'blog/a.png',
          Size: 10,
          LastModified: new Date('2020-01-01T00:00:00.000Z'),
        },
      ],
      IsTruncated: true,
      NextContinuationToken: 'tok',
    }))
    const provider = makeProvider(send)
    const res = await provider.list({
      companion: companionWith(['b']),
      providerUserSession: { bucket: 'b', prefix: '' },
      directory: 'blog/',
    })
    expect((send.mock.calls[0] as unknown[])[0]).toMatchObject({
      input: { Bucket: 'b', Prefix: 'blog/', Delimiter: '/' },
    })
    expect(res.items).toEqual([
      {
        isFolder: true,
        icon: 'folder',
        id: 'blog%2Fsub%2F',
        name: 'sub',
        requestPath: 'blog%2Fsub%2F',
      },
      {
        isFolder: false,
        icon: 'file',
        id: 'blog%2Fa.png',
        name: 'a.png',
        requestPath: 'blog%2Fa.png',
        modifiedDate: '2020-01-01T00:00:00.000Z',
        mimeType: 'image/png',
        size: 10,
        thumbnail: null,
      },
    ])
    expect(res.nextPagePath).toBe('blog%2F?cursor=tok')
    expect(res.username).toBe('b')
  })

  test('list passes the continuation cursor and cannot escape the session prefix', async () => {
    const send = vi.fn(async () => ({ Contents: [], IsTruncated: false }))
    const provider = makeProvider(send)
    await expect(
      provider.list({
        companion: companionWith(['b']),
        providerUserSession: { bucket: 'b', prefix: 'tenant/' },
        directory: 'other-tenant/',
        query: { cursor: 'tok' },
      }),
    ).rejects.toThrow(ProviderUserError)
    expect(send).not.toHaveBeenCalled()
    await provider.list({
      companion: companionWith(['b']),
      providerUserSession: { bucket: 'b', prefix: 'tenant/' },
      query: { cursor: 'tok' },
    })
    expect((send.mock.calls[0] as unknown[])[0]).toMatchObject({
      input: { Prefix: 'tenant/', ContinuationToken: 'tok' },
    })
  })

  test('refuses buckets that are not allowlisted', async () => {
    const provider = makeProvider(vi.fn(async () => ({ Contents: [] })))
    const session = { bucket: 'b', prefix: '' }
    await expect(
      provider.list({
        companion: companionWith(undefined),
        providerUserSession: session,
      }),
    ).rejects.toThrow('User error')
    await expect(
      provider.list({
        companion: companionWith(['other']),
        providerUserSession: session,
      }),
    ).rejects.toThrow('User error')
    expect(
      await provider.list({
        companion: companionWith(['*']),
        providerUserSession: session,
      }),
    ).toMatchObject({ items: [] })
  })

  test('download streams the object and enforces the session prefix', async () => {
    const send = vi.fn(async () => ({
      Body: Readable.from(['hello']),
      ContentLength: 5,
    }))
    const provider = makeProvider(send)
    const res = await provider.download({
      companion: companionWith(['b']),
      id: 'tenant/file.txt',
      providerUserSession: { bucket: 'b', prefix: 'tenant/' },
    })
    expect(res.size).toBe(5)
    expect((send.mock.calls[0] as unknown[])[0]).toMatchObject({
      input: { Bucket: 'b', Key: 'tenant/file.txt' },
    })
    await expect(
      provider.download({
        companion: companionWith(['b']),
        id: 'other/file.txt',
        providerUserSession: { bucket: 'b', prefix: 'tenant/' },
      }),
    ).rejects.toThrow(ProviderUserError)
  })

  test('mutations require the bucket to be in mutableBuckets', async () => {
    const send = vi.fn(async () => ({}))
    const provider = makeProvider(send)
    const session = { bucket: 'b', prefix: '' }
    await expect(
      provider.deleteItem({
        companion: companionWith(['b']),
        id: 'x.txt',
        providerUserSession: session,
      }),
    ).rejects.toBeInstanceOf(ProviderUserError)
    await expect(
      provider.createFolder({
        companion: companionWith(['b'], ['other']),
        parentId: null,
        name: 'docs',
        providerUserSession: session,
      }),
    ).rejects.toBeInstanceOf(ProviderUserError)
    expect(send).not.toHaveBeenCalled()
    expect(
      await provider.deleteItem({
        companion: companionWith(['b'], ['*']),
        id: 'x.txt',
        providerUserSession: session,
      }),
    ).toBeUndefined()
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([
      { Bucket: 'b', Key: 'x.txt' },
    ])
  })

  test('deleteItem refuses folders that still have entries', async () => {
    let listing: Record<string, unknown> = {
      Contents: [{ Key: 'a/' }, { Key: 'a/x.txt' }],
    }
    const send = vi.fn(async (cmd: unknown) =>
      cmd instanceof ListObjectsV2Command ? listing : {},
    )
    const provider = makeProvider(send)
    const args = {
      companion: companionWith(['b'], ['b']),
      id: 'a/',
      providerUserSession: { bucket: 'b', prefix: '' },
    }
    await expect(provider.deleteItem(args)).rejects.toThrow('User error')
    listing = { CommonPrefixes: [{ Prefix: 'a/sub/' }], Contents: [] }
    await expect(provider.deleteItem(args)).rejects.toThrow('User error')
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([])
    listing = { Contents: [{ Key: 'a/' }] }
    expect(await provider.deleteItem(args)).toBeUndefined()
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([
      { Bucket: 'b', Key: 'a/' },
    ])
  })

  test('moveItem renames files without overwriting and stays inside the prefix', async () => {
    const send = vi.fn(async (cmd: unknown) => {
      if (cmd instanceof HeadObjectCommand) {
        if ((cmd as unknown as Cmd).input['Key'] === 't/taken.txt') return {}
        if ((cmd as unknown as Cmd).input['Key'] === 't/a.txt')
          return { ContentLength: 1, ETag: 'source-etag' }
        throw notFound()
      }
      return {}
    })
    const provider = makeProvider(send)
    const companion = companionWith(['b'], ['b'])
    const providerUserSession = { bucket: 'b', prefix: 't/' }
    await expect(
      provider.moveItem({
        companion,
        id: 't/a.txt',
        destination: 't/taken.txt',
        providerUserSession,
      }),
    ).rejects.toThrow('User error')
    await expect(
      provider.moveItem({
        companion,
        id: 't/a.txt',
        destination: 'other/a.txt',
        providerUserSession,
      }),
    ).rejects.toBeInstanceOf(ProviderUserError)
    await expect(
      provider.moveItem({
        companion,
        id: 't/a.txt',
        destination: 't/../a.txt',
        providerUserSession,
      }),
    ).rejects.toBeInstanceOf(ProviderUserError)
    await expect(
      provider.moveItem({
        companion,
        id: 't/a.txt',
        destination: 't/sub/',
        providerUserSession,
      }),
    ).rejects.toThrow('User error')
    expect(inputsOf(send, CopyObjectCommand)).toEqual([])
    expect(
      await provider.moveItem({
        companion,
        id: 't/a.txt',
        destination: 't/b.txt',
        providerUserSession,
      }),
    ).toEqual({ id: 't/b.txt', requestPath: 't%2Fb.txt' })
    expect(inputsOf(send, CopyObjectCommand)).toEqual([
      {
        Bucket: 'b',
        CopySource: '/b/t/a.txt',
        Key: 't/b.txt',
        IfNoneMatch: '*',
        CopySourceIfMatch: 'source-etag',
      },
    ])
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([
      { Bucket: 'b', Key: 't/a.txt', IfMatch: 'source-etag' },
    ])
  })

  test('moveItem moves folders entry by entry, copying before deleting', async () => {
    const listings: Record<string, unknown> = {
      'old/': {
        CommonPrefixes: [{ Prefix: 'old/sub/' }],
        Contents: [
          { Key: 'old/', ETag: 'folder' },
          { Key: 'old/a.txt', ETag: 'a' },
        ],
      },
      'old/sub/': { Contents: [{ Key: 'old/sub/b.txt', ETag: 'b' }] },
      'new/': { Contents: [] },
    }
    const send = vi.fn(async (cmd: unknown) => {
      if (cmd instanceof ListObjectsV2Command)
        return (
          listings[(cmd as unknown as Cmd).input['Prefix'] as string] ?? {
            Contents: [],
          }
        )
      if (cmd instanceof HeadObjectCommand) throw notFound()
      return {}
    })
    const provider = makeProvider(send)
    const companion = companionWith(['b'], ['b'])
    const providerUserSession = { bucket: 'b', prefix: '' }
    await expect(
      provider.moveItem({
        companion,
        id: 'old/',
        destination: 'old/inner/',
        providerUserSession,
      }),
    ).rejects.toThrow('User error')
    expect(
      await provider.moveItem({
        companion,
        id: 'old/',
        destination: 'new',
        providerUserSession,
      }),
    ).toEqual({ id: 'new/', requestPath: 'new%2F' })
    expect(inputsOf(send, PutObjectCommand).map((i) => i['Key'])).toEqual([
      'new/',
      'new/sub/',
    ])
    expect(inputsOf(send, CopyObjectCommand)).toEqual([
      {
        Bucket: 'b',
        CopySource: '/b/old/a.txt',
        Key: 'new/a.txt',
        IfNoneMatch: '*',
        CopySourceIfMatch: 'a',
      },
      {
        Bucket: 'b',
        CopySource: '/b/old/sub/b.txt',
        Key: 'new/sub/b.txt',
        IfNoneMatch: '*',
        CopySourceIfMatch: 'b',
      },
    ])
    expect(inputsOf(send, DeleteObjectCommand).map((i) => i['Key'])).toEqual([
      'old/a.txt',
      'old/sub/b.txt',
      'old/',
    ])
    const order = send.mock.calls.map((c) => (c[0] as object).constructor.name)
    expect(order.lastIndexOf('CopyObjectCommand')).toBeLessThan(
      order.indexOf('DeleteObjectCommand'),
    )
  })

  test('createFolder refuses names that already exist', async () => {
    const send = vi.fn(async (cmd: unknown) => {
      if (cmd instanceof ListObjectsV2Command) return { Contents: [] }
      if (cmd instanceof HeadObjectCommand) {
        if ((cmd as unknown as Cmd).input['Key'] === 'docs/taken/') return {}
        throw notFound()
      }
      return {}
    })
    const provider = makeProvider(send)
    const companion = companionWith(['b'], ['b'])
    const providerUserSession = { bucket: 'b', prefix: '' }
    await expect(
      provider.createFolder({
        companion,
        parentId: 'docs/',
        name: 'taken',
        providerUserSession,
      }),
    ).rejects.toThrow('User error')
    expect(
      await provider.createFolder({
        companion,
        parentId: 'docs/',
        name: ' fresh ',
        providerUserSession,
      }),
    ).toEqual({ id: 'docs/fresh/', requestPath: 'docs%2Ffresh%2F' })
    expect(inputsOf(send, PutObjectCommand)).toEqual([
      { Bucket: 'b', Key: 'docs/fresh/', Body: '', IfNoneMatch: '*' },
    ])
  })

  describe('storage grants', () => {
    test('a valid grant becomes a scoped, expiring session', async () => {
      const provider = makeProvider()
      const session = await provider.simpleAuth({
        requestBody: { form: { grant: mintGrant({ prefix: '/tenant' }) } },
        companion: companionWith(['b'], ['b'], { grantSecret: GRANT_SECRET }),
      })
      expect(session).toMatchObject({
        bucket: 'b',
        prefix: 'tenant/',
        scopes: ['read', 'write'],
      })
      expect(session.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    test('expired grants are auth errors, tampered grants are user errors', async () => {
      const provider = makeProvider()
      const companion = companionWith(['b'], ['b'], {
        grantSecret: GRANT_SECRET,
      })
      await expect(
        provider.simpleAuth({
          requestBody: {
            form: {
              grant: mintGrant({ exp: Math.floor(Date.now() / 1000) - 60 }),
            },
          },
          companion,
        }),
      ).rejects.toBeInstanceOf(ProviderAuthError)
      await expect(
        provider.simpleAuth({
          requestBody: { form: { grant: mintGrant({}, 'another-secret') } },
          companion,
        }),
      ).rejects.toBeInstanceOf(ProviderUserError)
      await expect(
        provider.simpleAuth({
          requestBody: { form: { grant: mintGrant({ scopes: ['admin'] }) } },
          companion,
        }),
      ).rejects.toBeInstanceOf(ProviderUserError)
    })

    test('bucket auth is refused once a grant secret is configured, unless allowed for dev', async () => {
      const provider = makeProvider()
      await expect(
        provider.simpleAuth({
          requestBody: { form: { bucket: 'b' } },
          companion: companionWith(['b'], [], { grantSecret: GRANT_SECRET }),
        }),
      ).rejects.toThrow('User error')
      expect(
        await provider.simpleAuth({
          requestBody: { form: { bucket: 'b/tenant' } },
          companion: companionWith(['b'], [], {
            grantSecret: GRANT_SECRET,
            allowBucketAuth: true,
          }),
        }),
      ).toEqual({
        bucket: 'b',
        prefix: 'tenant/',
        scopes: ['read', 'write'],
      })
      await expect(
        provider.simpleAuth({
          requestBody: { form: { grant: mintGrant() } },
          companion: companionWith(['b']),
        }),
      ).rejects.toBeInstanceOf(ProviderUserError)
    })

    test('read-only and expired sessions are enforced on every operation', async () => {
      const send = vi.fn(async () => ({ Contents: [] }))
      const provider = makeProvider(send)
      const companion = companionWith(['b'], ['b'])
      const readOnly = {
        bucket: 'b',
        prefix: '',
        scopes: ['read' as const],
        exp: 2_000_000_000,
      }
      expect(
        await provider.list({ companion, providerUserSession: readOnly }),
      ).toMatchObject({ items: [] })
      await expect(
        provider.createFolder({
          companion,
          parentId: null,
          name: 'x',
          providerUserSession: readOnly,
        }),
      ).rejects.toBeInstanceOf(ProviderUserError)
      const expired = {
        ...readOnly,
        scopes: ['read' as const, 'write' as const],
        exp: 1,
      }
      await expect(
        provider.list({ companion, providerUserSession: expired }),
      ).rejects.toBeInstanceOf(ProviderAuthError)
      expect(send).toHaveBeenCalledTimes(1)
    })
  })
})
