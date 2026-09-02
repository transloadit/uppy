import { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'
import { describe, expect, test, vi } from 'vitest'
import {
  ProviderAuthError,
  ProviderUserError,
} from '../src/server/provider/error.js'
import S3Provider from '../src/server/provider/s3/index.js'

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
  extra: { grantSecret?: string; allowBucketAuth?: boolean } = {},
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
  Object.assign(new Error('NotFound'), {
    name: 'NotFound',
    $metadata: { httpStatusCode: 404 },
  })

type Cmd = { input: Record<string, unknown> }
const inputsOf = (send: ReturnType<typeof vi.fn>, type: unknown) =>
  send.mock.calls
    .map((c) => c[0])
    .filter((cmd) => cmd instanceof (type as never))
    .map((cmd) => (cmd as unknown as Cmd).input)

describe('S3 provider', () => {
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
    ).rejects.toThrow()
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
    await provider.list({
      companion: companionWith(['b']),
      providerUserSession: { bucket: 'b', prefix: 'tenant/' },
      directory: 'other-tenant/',
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
    await expect(
      provider.list({
        companion: companionWith(['*']),
        providerUserSession: session,
      }),
    ).resolves.toMatchObject({ items: [] })
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
    ).rejects.toThrow()
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
    await expect(
      provider.deleteItem({
        companion: companionWith(['b'], ['*']),
        id: 'x.txt',
        providerUserSession: session,
      }),
    ).resolves.toBeUndefined()
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
    await expect(provider.deleteItem(args)).resolves.toBeUndefined()
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([
      { Bucket: 'b', Key: 'a/' },
    ])
  })

  test('moveItem renames files without overwriting and stays inside the prefix', async () => {
    const send = vi.fn(async (cmd: unknown) => {
      if (cmd instanceof HeadObjectCommand) {
        if ((cmd as unknown as Cmd).input['Key'] === 't/taken.txt') return {}
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
    await expect(
      provider.moveItem({
        companion,
        id: 't/a.txt',
        destination: 't/b.txt',
        providerUserSession,
      }),
    ).resolves.toEqual({ id: 't/b.txt', requestPath: 't%2Fb.txt' })
    expect(inputsOf(send, CopyObjectCommand)).toEqual([
      { Bucket: 'b', CopySource: '/b/t/a.txt', Key: 't/b.txt' },
    ])
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([
      { Bucket: 'b', Key: 't/a.txt' },
    ])
  })

  test('moveItem moves folders entry by entry, copying before deleting', async () => {
    const listings: Record<string, unknown> = {
      'old/': {
        CommonPrefixes: [{ Prefix: 'old/sub/' }],
        Contents: [{ Key: 'old/' }, { Key: 'old/a.txt' }],
      },
      'old/sub/': { Contents: [{ Key: 'old/sub/b.txt' }] },
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
    await expect(
      provider.moveItem({
        companion,
        id: 'old/',
        destination: 'new',
        providerUserSession,
      }),
    ).resolves.toEqual({ id: 'new/', requestPath: 'new%2F' })
    expect(inputsOf(send, PutObjectCommand).map((i) => i['Key'])).toEqual([
      'new/',
      'new/sub/',
    ])
    expect(inputsOf(send, CopyObjectCommand)).toEqual([
      { Bucket: 'b', CopySource: '/b/old/a.txt', Key: 'new/a.txt' },
      { Bucket: 'b', CopySource: '/b/old/sub/b.txt', Key: 'new/sub/b.txt' },
    ])
    expect(inputsOf(send, DeleteObjectCommand).map((i) => i['Key'])).toEqual([
      'old/a.txt',
      'old/sub/b.txt',
      'old/sub/',
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
    await expect(
      provider.createFolder({
        companion,
        parentId: 'docs/',
        name: ' fresh ',
        providerUserSession,
      }),
    ).resolves.toEqual({ id: 'docs/fresh/', requestPath: 'docs%2Ffresh%2F' })
    expect(inputsOf(send, PutObjectCommand)).toEqual([
      { Bucket: 'b', Key: 'docs/fresh/', Body: '' },
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
      await expect(
        provider.simpleAuth({
          requestBody: { form: { bucket: 'b/tenant' } },
          companion: companionWith(['b'], [], {
            grantSecret: GRANT_SECRET,
            allowBucketAuth: true,
          }),
        }),
      ).resolves.toEqual({
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
      await expect(
        provider.list({ companion, providerUserSession: readOnly }),
      ).resolves.toMatchObject({ items: [] })
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
