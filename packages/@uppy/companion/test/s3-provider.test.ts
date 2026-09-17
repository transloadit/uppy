import { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
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
  const client = Object.assign(Object.create(S3Client.prototype), { send })
  vi.spyOn(provider, 'getClient').mockReturnValue(client as never)
  return provider
}

type S3Cfg = Record<string, unknown>
/** Companion options with the provider configured under `providerOptions.s3`. */
const companionWith = (s3Provider?: S3Cfg, s3Upload?: S3Cfg) =>
  ({
    options: {
      s3: s3Upload,
      providerOptions: s3Provider ? { s3: s3Provider } : {},
    },
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

const userError = (message: string) =>
  expect.objectContaining({ name: 'ProviderUserError', json: { message } })

const bucketCompanion = companionWith({ bucket: 'b', region: 'r' })
const bucketSession = { bucket: 'b', prefix: '', write: true }

describe('S3 provider', () => {
  describe('configuration', () => {
    test('is off until providerOptions.s3 has a bucket or a grant key', async () => {
      const provider = makeProvider()
      await expect(
        provider.simpleAuth({
          requestBody: { form: {} },
          companion: companionWith(undefined),
        }),
      ).rejects.toEqual(userError('s3NotConfigured'))
      await expect(
        provider.simpleAuth({
          requestBody: { form: {} },
          companion: companionWith({ region: 'r' }),
        }),
      ).rejects.toEqual(userError('s3NotConfigured'))
    })

    test('bucket mode: every session gets the configured bucket and prefix', async () => {
      const provider = makeProvider()
      expect(
        await provider.simpleAuth({
          requestBody: { form: { bucket: 'other', grant: 'x' } },
          companion: companionWith({ bucket: 'b', prefix: '/uploads' }),
        }),
      ).toEqual({ bucket: 'b', prefix: 'uploads/', write: true })
      expect(
        provider.simpleAuthTokenMaxAge({
          bucket: 'b',
          prefix: '',
          write: true,
        }),
      ).toBe(S3Provider.authStateExpiry)
    })

    test("the provider's credentials fall back to the upload block", async () => {
      const provider = makeProvider(vi.fn(async () => ({ Contents: [] })))
      const getClient = vi.mocked(provider.getClient)
      await provider.list({
        companion: companionWith(
          { bucket: 'b', key: 'provider-key', secret: 'provider-secret' },
          { key: 'upload-key', secret: 'upload-secret', region: 'eu-west-1' },
        ),
        providerUserSession: bucketSession,
      })
      expect(getClient.mock.calls[0]?.[0]).toMatchObject({
        s3: {
          key: 'provider-key',
          secret: 'provider-secret',
          region: 'eu-west-1',
          useAccelerateEndpoint: false,
        },
      })
    })

    test('sessions from another configuration are rejected as unauthenticated', async () => {
      const provider = makeProvider(vi.fn(async () => ({ Contents: [] })))
      for (const providerUserSession of [
        { bucket: 'other', prefix: '', write: true },
        { bucket: 'b', prefix: 'old/', write: true },
        // the shape of a session from before this version
        { bucket: 'b', prefix: '', scopes: ['read', 'write'] },
      ]) {
        await expect(
          provider.list({
            companion: bucketCompanion,
            providerUserSession: providerUserSession as never,
          }),
        ).rejects.toBeInstanceOf(ProviderAuthError)
      }
    })
  })

  describe('storage grants', () => {
    const companion = companionWith({ grantSecret: GRANT_SECRET, region: 'r' })

    test('a valid grant becomes a session that expires with the grant', async () => {
      const provider = makeProvider()
      const session = await provider.simpleAuth({
        requestBody: { form: { grant: mintGrant({ prefix: '/tenant' }) } },
        companion,
      })
      expect(session).toMatchObject({
        bucket: 'b',
        prefix: 'tenant/',
        write: true,
      })
      const now = Math.floor(Date.now() / 1000)
      expect(session.exp).toBeGreaterThan(now)
      const maxAge = provider.simpleAuthTokenMaxAge(session)
      expect(maxAge).toBeGreaterThan(800)
      expect(maxAge).toBeLessThanOrEqual(900)
    })

    test('read-only grants open read-only sessions', async () => {
      const provider = makeProvider()
      expect(
        await provider.simpleAuth({
          requestBody: { form: { grant: mintGrant({ scopes: ['read'] }) } },
          companion,
        }),
      ).toMatchObject({ write: false })
    })

    test('expired grants are auth errors, anything else invalid is a user error', async () => {
      const provider = makeProvider()
      const auth = (grant: unknown) =>
        provider.simpleAuth({ requestBody: { form: { grant } }, companion })
      await expect(
        auth(mintGrant({ exp: Math.floor(Date.now() / 1000) - 60 })),
      ).rejects.toBeInstanceOf(ProviderAuthError)
      await expect(auth(mintGrant({}, 'another-secret'))).rejects.toEqual(
        userError('s3InvalidGrant'),
      )
      await expect(auth(mintGrant({ scopes: ['write'] }))).rejects.toEqual(
        userError('s3InvalidGrant'),
      )
      await expect(auth(undefined)).rejects.toEqual(userError('s3InvalidGrant'))
    })

    test('grants signed with a rotated-in secret verify too', async () => {
      const provider = makeProvider()
      expect(
        await provider.simpleAuth({
          requestBody: { form: { grant: mintGrant({}, 'new-secret') } },
          companion: companionWith({
            grantSecret: [GRANT_SECRET, 'new-secret'],
          }),
        }),
      ).toMatchObject({ bucket: 'b' })
    })

    test('the bucket option is ignored once a grant key is configured', async () => {
      const provider = makeProvider()
      await expect(
        provider.simpleAuth({
          requestBody: { form: {} },
          companion: companionWith({ bucket: 'b', grantSecret: GRANT_SECRET }),
        }),
      ).rejects.toEqual(userError('s3InvalidGrant'))
    })

    test('read-only sessions may list but not change anything', async () => {
      const send = vi.fn(async () => ({ Contents: [] }))
      const provider = makeProvider(send)
      const readOnly = { bucket: 'b', prefix: '', write: false }
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
      ).rejects.toEqual(userError('s3ReadOnlySession'))
      await expect(
        provider.deleteItem({
          companion,
          id: 'x.txt',
          providerUserSession: readOnly,
        }),
      ).rejects.toEqual(userError('s3ReadOnlySession'))
      expect(send).toHaveBeenCalledTimes(1)
    })
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
      companion: bucketCompanion,
      providerUserSession: bucketSession,
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

  test('list passes the continuation cursor and refuses to leave the session prefix', async () => {
    const send = vi.fn(async () => ({ Contents: [], IsTruncated: false }))
    const provider = makeProvider(send)
    const companion = companionWith({ bucket: 'b', prefix: 'tenant/' })
    const providerUserSession = { bucket: 'b', prefix: 'tenant/', write: true }
    await provider.list({
      companion,
      providerUserSession,
      directory: 'tenant/sub/',
      query: { cursor: 'tok' },
    })
    expect((send.mock.calls[0] as unknown[])[0]).toMatchObject({
      input: { Prefix: 'tenant/sub/', ContinuationToken: 'tok' },
    })
    await expect(
      provider.list({
        companion,
        providerUserSession,
        directory: 'other-tenant/',
      }),
    ).rejects.toEqual(userError('s3OutsideAllowedFolder'))
    expect(send).toHaveBeenCalledTimes(1)
  })

  test('download streams the object and enforces the session prefix', async () => {
    const send = vi.fn(async () => ({
      Body: Readable.from(['hello']),
      ContentLength: 5,
    }))
    const provider = makeProvider(send)
    const companion = companionWith({ bucket: 'b', prefix: 'tenant/' })
    const providerUserSession = { bucket: 'b', prefix: 'tenant/', write: true }
    const res = await provider.download({
      companion,
      id: 'tenant/file.txt',
      providerUserSession,
    })
    expect(res.size).toBe(5)
    expect((send.mock.calls[0] as unknown[])[0]).toMatchObject({
      input: { Bucket: 'b', Key: 'tenant/file.txt' },
    })
    await expect(
      provider.download({
        companion,
        id: 'other/file.txt',
        providerUserSession,
      }),
    ).rejects.toEqual(userError('s3OutsideAllowedFolder'))
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
      companion: bucketCompanion,
      id: 'a/',
      providerUserSession: bucketSession,
    }
    await expect(provider.deleteItem(args)).rejects.toEqual(
      userError('s3FolderNotEmpty'),
    )
    listing = { CommonPrefixes: [{ Prefix: 'a/sub/' }], Contents: [] }
    await expect(provider.deleteItem(args)).rejects.toEqual(
      userError('s3FolderNotEmpty'),
    )
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([])
    listing = { Contents: [{ Key: 'a/' }] }
    expect(await provider.deleteItem(args)).toBeUndefined()
    expect(inputsOf(send, DeleteObjectCommand)).toEqual([
      { Bucket: 'b', Key: 'a/' },
    ])
  })

  describe('moveItem', () => {
    const heads: Record<string, { ContentLength: number; ETag: string }> = {
      't/a.txt': { ContentLength: 3, ETag: '"etag-a"' },
      't/taken.txt': { ContentLength: 9, ETag: '"etag-taken"' },
      't/copied.txt': { ContentLength: 3, ETag: '"etag-a"' },
      't/huge.bin': { ContentLength: 6 * 1024 ** 3, ETag: '"etag-huge"' },
    }
    const makeMoveProvider = () => {
      const send = vi.fn(async (cmd: unknown) => {
        if (cmd instanceof HeadObjectCommand) {
          const head = heads[(cmd as unknown as Cmd).input['Key'] as string]
          if (head) return head
          throw notFound()
        }
        return {}
      })
      return { provider: makeProvider(send), send }
    }
    const companion = companionWith({ bucket: 'b', prefix: 't/' })
    const providerUserSession = { bucket: 'b', prefix: 't/', write: true }
    const move = (
      provider: S3Provider,
      id: string,
      destination: string,
      c = companion,
    ) =>
      provider.moveItem({ companion: c, id, destination, providerUserSession })

    test('renames a file: copy, then delete', async () => {
      const { provider, send } = makeMoveProvider()
      expect(await move(provider, 't/a.txt', 't/b.txt')).toEqual({
        id: 't/b.txt',
        requestPath: 't%2Fb.txt',
      })
      expect(inputsOf(send, CopyObjectCommand)).toEqual([
        { Bucket: 'b', CopySource: '/b/t/a.txt', Key: 't/b.txt' },
      ])
      expect(inputsOf(send, DeleteObjectCommand)).toEqual([
        { Bucket: 'b', Key: 't/a.txt' },
      ])
      const order = send.mock.calls.map(
        (c) => (c[0] as object).constructor.name,
      )
      expect(order.indexOf('CopyObjectCommand')).toBeLessThan(
        order.indexOf('DeleteObjectCommand'),
      )
    })

    test('refuses conflicts, folders, and anything outside the prefix', async () => {
      const { provider, send } = makeMoveProvider()
      await expect(move(provider, 't/a.txt', 't/taken.txt')).rejects.toEqual(
        userError('s3AlreadyExists'),
      )
      await expect(move(provider, 't/a.txt', 'other/a.txt')).rejects.toEqual(
        userError('s3OutsideAllowedFolder'),
      )
      await expect(move(provider, 't/a.txt', 't/sub/')).rejects.toEqual(
        userError('s3DestinationMustBeFile'),
      )
      await expect(move(provider, 't/sub/', 't/moved/')).rejects.toEqual(
        userError('s3FolderMoveNotSupported'),
      )
      await expect(move(provider, 't/missing.txt', 't/x.txt')).rejects.toEqual(
        userError('s3NotFound'),
      )
      await expect(move(provider, 't/huge.bin', 't/x.bin')).rejects.toEqual(
        userError('s3FileTooLargeToMove'),
      )
      expect(inputsOf(send, CopyObjectCommand)).toEqual([])
      expect(inputsOf(send, DeleteObjectCommand)).toEqual([])
    })

    test('resumes an interrupted move when the destination already holds the same object', async () => {
      const { provider, send } = makeMoveProvider()
      expect(await move(provider, 't/a.txt', 't/copied.txt')).toEqual({
        id: 't/copied.txt',
        requestPath: 't%2Fcopied.txt',
      })
      expect(inputsOf(send, CopyObjectCommand)).toEqual([])
      expect(inputsOf(send, DeleteObjectCommand)).toEqual([
        { Bucket: 'b', Key: 't/a.txt' },
      ])
    })

    test('copies carry the configured ACL and encryption, falling back to the upload block', async () => {
      const { provider, send } = makeMoveProvider()
      await move(
        provider,
        't/a.txt',
        't/b.txt',
        companionWith(
          { bucket: 'b', prefix: 't/', acl: 'public-read' },
          { awsSse: 'aws:kms', awsSseKmsKeyId: 'kms-key' },
        ),
      )
      expect(inputsOf(send, CopyObjectCommand)).toEqual([
        {
          Bucket: 'b',
          CopySource: '/b/t/a.txt',
          Key: 't/b.txt',
          ACL: 'public-read',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: 'kms-key',
        },
      ])
    })
  })

  describe('createFolder', () => {
    const makeFolderProvider = () => {
      const send = vi.fn(async (cmd: unknown) => {
        if (cmd instanceof ListObjectsV2Command) return { Contents: [] }
        if (cmd instanceof HeadObjectCommand) {
          if ((cmd as unknown as Cmd).input['Key'] === 'docs/taken/') return {}
          throw notFound()
        }
        return {}
      })
      return { provider: makeProvider(send), send }
    }

    test('refuses names that already exist or are not a single segment', async () => {
      const { provider, send } = makeFolderProvider()
      const create = (parentId: string | null, name: string) =>
        provider.createFolder({
          companion: bucketCompanion,
          parentId,
          name,
          providerUserSession: bucketSession,
        })
      await expect(create('docs/', 'taken')).rejects.toEqual(
        userError('s3AlreadyExists'),
      )
      await expect(create('docs/', 'a/b')).rejects.toEqual(
        userError('s3InvalidName'),
      )
      await expect(create('docs/', '..')).rejects.toEqual(
        userError('s3InvalidName'),
      )
      await expect(create('docs/', '  ')).rejects.toEqual(
        userError('s3InvalidName'),
      )
      expect(inputsOf(send, PutObjectCommand)).toEqual([])
      expect(await create('docs/', ' fresh ')).toEqual({
        id: 'docs/fresh/',
        requestPath: 'docs%2Ffresh%2F',
      })
      expect(inputsOf(send, PutObjectCommand)).toEqual([
        { Bucket: 'b', Key: 'docs/fresh/', Body: '' },
      ])
    })

    test('keeps the parent inside the prefix and marks folders with the write settings', async () => {
      const { provider, send } = makeFolderProvider()
      const companion = companionWith({
        bucket: 'b',
        prefix: 't/',
        awsSse: 'AES256',
      })
      const providerUserSession = { bucket: 'b', prefix: 't/', write: true }
      await expect(
        provider.createFolder({
          companion,
          parentId: 'other/',
          name: 'x',
          providerUserSession,
        }),
      ).rejects.toEqual(userError('s3OutsideAllowedFolder'))
      expect(
        await provider.createFolder({
          companion,
          parentId: null,
          name: 'x',
          providerUserSession,
        }),
      ).toEqual({ id: 't/x/', requestPath: 't%2Fx%2F' })
      expect(inputsOf(send, PutObjectCommand)).toEqual([
        { Bucket: 'b', Key: 't/x/', Body: '', ServerSideEncryption: 'AES256' },
      ])
    })
  })

  test('S3 errors reach the browser only as "not found" or a generic failure', async () => {
    const denied = new S3ServiceException({
      name: 'AccessDenied',
      $fault: 'client',
      $metadata: { httpStatusCode: 403 },
    })
    let error: unknown = denied
    const send = vi.fn(async () => {
      throw error
    })
    const provider = makeProvider(send)
    const list = () =>
      provider.list({
        companion: bucketCompanion,
        providerUserSession: bucketSession,
      })
    await expect(list()).rejects.toEqual(userError('s3RequestFailed'))
    error = notFound()
    await expect(list()).rejects.toEqual(userError('s3NotFound'))
    error = new ProviderUserError({ message: 'passthrough' })
    await expect(list()).rejects.toEqual(userError('passthrough'))
  })
})
