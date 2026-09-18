import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import {
  ProviderAuthError,
  ProviderUserError,
} from '../src/server/provider/error.js'
import S3Provider from '../src/server/provider/s3/index.js'
import TransloaditStorageProvider from '../src/server/provider/s3/transloadit-storage.js'
import {
  claims,
  GRANT_SECRET,
  type GrantClaims,
  mint,
  nowSeconds,
} from './fixtures/s3.js'

const makeProvider = (send: (cmd: unknown) => Promise<unknown> = vi.fn()) => {
  const provider = new S3Provider({ allowLocalUrls: false })
  vi.spyOn(provider, 'getClient').mockReturnValue({ send } as never)
  return provider
}

type S3Cfg = Record<string, unknown>
/**
 * Companion options with the provider configured under `providerOptions.s3`.
 * A fresh object every call: the provider caches its config and client per
 * options object, so sharing one would leak a client between tests.
 */
const companionWith = (s3Provider?: S3Cfg, s3Upload?: S3Cfg) =>
  ({
    options: {
      s3: s3Upload,
      providerOptions: s3Provider ? { s3: s3Provider } : {},
    },
  }) as never

const mintGrant = (overrides: GrantClaims = {}, secret = GRANT_SECRET) =>
  mint(
    claims({
      bucket: 'b',
      prefix: 'tenant/',
      scopes: ['read', 'write'],
      sub: 'user-1',
      ...overrides,
    }),
    secret,
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

const bucketCompanion = () => companionWith({ bucket: 'b', region: 'r' })
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
      const session = await provider.simpleAuth({
        requestBody: { form: { bucket: 'other', grant: 'x' } },
        companion: companionWith({ bucket: 'b', prefix: '/uploads' }),
      })
      // No `exp`: the session token gets Companion's default lifetime.
      expect(session).toEqual({ bucket: 'b', prefix: 'uploads/', write: true })
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

    test('the client is built once per companion options object', async () => {
      const provider = makeProvider(vi.fn(async () => ({ Contents: [] })))
      const companion = bucketCompanion()
      await provider.list({ companion, providerUserSession: bucketSession })
      await provider.deleteItem({
        companion,
        id: 'x.txt',
        providerUserSession: bucketSession,
      })
      expect(vi.mocked(provider.getClient)).toHaveBeenCalledTimes(1)
    })

    test('a second companion options object gets its own client', async () => {
      const provider = makeProvider(vi.fn(async () => ({ Contents: [] })))
      for (const companion of [bucketCompanion(), bucketCompanion()]) {
        await provider.list({ companion, providerUserSession: bucketSession })
      }
      expect(vi.mocked(provider.getClient)).toHaveBeenCalledTimes(2)
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
            companion: bucketCompanion(),
            providerUserSession: providerUserSession as never,
          }),
        ).rejects.toBeInstanceOf(ProviderAuthError)
      }
    })
  })

  describe('storage grants', () => {
    const companion = () =>
      companionWith({ grantSecret: GRANT_SECRET, region: 'r' })

    test('a valid grant becomes a session that expires with the grant', async () => {
      const provider = makeProvider()
      const session = await provider.simpleAuth({
        requestBody: { form: { grant: mintGrant({ prefix: '/tenant' }) } },
        companion: companion(),
      })
      expect(session).toMatchObject({
        bucket: 'b',
        prefix: 'tenant/',
        write: true,
      })
      // `exp` is what sizes the session token: it expires with the grant.
      const now = nowSeconds()
      expect(session.exp).toBeGreaterThan(now + 800)
      expect(session.exp).toBeLessThanOrEqual(now + 900)
    })

    test('read-only grants open read-only sessions', async () => {
      const provider = makeProvider()
      expect(
        await provider.simpleAuth({
          requestBody: { form: { grant: mintGrant({ scopes: ['read'] }) } },
          companion: companion(),
        }),
      ).toMatchObject({ write: false })
    })

    test('expired grants are auth errors, anything else invalid is a user error', async () => {
      const provider = makeProvider()
      const auth = (grant: unknown) =>
        provider.simpleAuth({
          requestBody: { form: { grant } },
          companion: companion(),
        })
      await expect(
        auth(mintGrant({ exp: nowSeconds() - 60 })),
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

    test('refuses a bucket next to a grant key even without startup validation', async () => {
      const provider = makeProvider()
      await expect(
        provider.simpleAuth({
          requestBody: { form: {} },
          companion: companionWith({ bucket: 'b', grantSecret: GRANT_SECRET }),
        }),
      ).rejects.toEqual(userError('s3NotConfigured'))
    })

    test('read-only sessions may list but not change anything', async () => {
      const send = vi.fn(async () => ({ Contents: [] }))
      const provider = makeProvider(send)
      const readOnly = { bucket: 'b', prefix: '', write: false }
      const options = companion()
      expect(
        await provider.list({
          companion: options,
          providerUserSession: readOnly,
        }),
      ).toMatchObject({ items: [] })
      await expect(
        provider.createFolder({
          companion: options,
          parentId: null,
          name: 'x',
          providerUserSession: readOnly,
        }),
      ).rejects.toEqual(userError('s3ReadOnlySession'))
      await expect(
        provider.deleteItem({
          companion: options,
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
      companion: bucketCompanion(),
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
      query: { bucket: 'b' },
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
        query: { bucket: 'b' },
        providerUserSession,
      }),
    ).rejects.toEqual(userError('s3OutsideAllowedFolder'))
    // A file queued while connected to another bucket is never read from this one.
    for (const query of [undefined, {}, { bucket: 'other' }]) {
      await expect(
        provider.download({
          companion,
          id: 'tenant/file.txt',
          query,
          providerUserSession,
        }),
      ).rejects.toEqual(userError('s3SelectedInOtherSession'))
    }
    expect(send).toHaveBeenCalledTimes(1)
  })

  test('list reports the write capability and the session root', async () => {
    const provider = makeProvider(vi.fn(async () => ({ Contents: [] })))
    const companion = companionWith({ bucket: 'b', prefix: 'tenant/' })
    expect(
      await provider.list({
        companion,
        providerUserSession: { bucket: 'b', prefix: 'tenant/', write: true },
      }),
    ).toMatchObject({
      session: { canWrite: true, supportsMoveFolder: false, prefix: 'tenant/' },
    })
    expect(
      await provider.list({
        companion,
        providerUserSession: { bucket: 'b', prefix: 'tenant/', write: false },
      }),
    ).toMatchObject({ session: { canWrite: false, prefix: 'tenant/' } })
  })

  test('keys with dot segments or backslashes never pass the prefix check', async () => {
    const provider = makeProvider(vi.fn(async () => ({})))
    for (const id of ['t/../x.txt', 't/./x.txt', 't/a\\b.txt']) {
      await expect(
        provider.deleteItem({
          companion: companionWith({ bucket: 'b', prefix: 't/' }),
          id,
          providerUserSession: { bucket: 'b', prefix: 't/', write: true },
        }),
      ).rejects.toEqual(userError('s3OutsideAllowedFolder'))
    }
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
      companion: bucketCompanion(),
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
      't/a.txt': {
        ContentLength: 3,
        ETag: '"47bce5c74f589f4867dbd57e9ca9f808"',
      },
      't/taken.txt': {
        ContentLength: 9,
        ETag: '"9c8fb2f5b8a1c3d4e5f60718293a4b5c"',
      },
      't/copied.txt': {
        ContentLength: 3,
        ETag: '"47bce5c74f589f4867dbd57e9ca9f808"',
      },
      't/huge.bin': {
        ContentLength: 6 * 1024 ** 3,
        ETag: '"0123456789abcdef0123456789abcdef-2"',
      },
      // A backend that answers a placeholder ETag for every object.
      't/p.txt': { ContentLength: 3, ETag: '"placeholder"' },
      't/p-copy.txt': { ContentLength: 3, ETag: '"placeholder"' },
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
    const companion = () => companionWith({ bucket: 'b', prefix: 't/' })
    const providerUserSession = { bucket: 'b', prefix: 't/', write: true }
    const move = (
      provider: S3Provider,
      id: string,
      destination: string,
      c = companion(),
    ) =>
      provider.moveItem({ companion: c, id, destination, providerUserSession })

    test('renames a file: copy, then delete', async () => {
      const { provider, send } = makeMoveProvider()
      expect(await move(provider, 't/a.txt', 't/b.txt')).toEqual({
        id: 't/b.txt',
        requestPath: 't%2Fb.txt',
      })
      // The copy never overwrites and copies exactly the inspected object;
      // the delete only removes that same object.
      expect(inputsOf(send, CopyObjectCommand)).toEqual([
        {
          Bucket: 'b',
          CopySource: '/b/t/a.txt',
          Key: 't/b.txt',
          IfNoneMatch: '*',
          CopySourceIfMatch: '"47bce5c74f589f4867dbd57e9ca9f808"',
        },
      ])
      expect(inputsOf(send, DeleteObjectCommand)).toEqual([
        {
          Bucket: 'b',
          Key: 't/a.txt',
          IfMatch: '"47bce5c74f589f4867dbd57e9ca9f808"',
        },
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

    test('does not trust a placeholder ETag to skip the copy', async () => {
      const { provider, send } = makeMoveProvider()
      await expect(move(provider, 't/p.txt', 't/p-copy.txt')).rejects.toEqual(
        userError('s3AlreadyExists'),
      )
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
        {
          Bucket: 'b',
          Key: 't/a.txt',
          IfMatch: '"47bce5c74f589f4867dbd57e9ca9f808"',
        },
      ])
    })

    test('a source replaced after the copy is kept and reported as a conflict', async () => {
      const { provider, send } = makeMoveProvider()
      send.mockImplementation(async (cmd: unknown) => {
        if (cmd instanceof HeadObjectCommand) {
          const key = (cmd as unknown as Cmd).input['Key'] as string
          if (key === 't/a.txt') return heads[key] as object
          throw notFound()
        }
        if (cmd instanceof DeleteObjectCommand) {
          // The endpoint honours IfMatch: the object changed since the HEAD.
          throw new S3ServiceException({
            name: 'PreconditionFailed',
            $fault: 'client',
            $metadata: { httpStatusCode: 412 },
          })
        }
        return {}
      })
      await expect(move(provider, 't/a.txt', 't/b.txt')).rejects.toEqual(
        userError('s3Conflict'),
      )
      expect(inputsOf(send, CopyObjectCommand)).toHaveLength(1)
    })

    test('concurrent moves cannot both land on one destination', async () => {
      const objects = new Map([
        ['t/a.txt', 'a'],
        ['t/b.txt', 'b'],
      ])
      const send = vi.fn(async (cmd: unknown) => {
        const input = (cmd as unknown as Cmd).input
        const key = input['Key'] as string
        if (cmd instanceof HeadObjectCommand) {
          if (!objects.has(key)) throw notFound()
          return {
            ContentLength: 1,
            ETag: `"${'0'.repeat(31)}${objects.get(key)}"`,
          }
        }
        if (cmd instanceof CopyObjectCommand) {
          if (input['IfNoneMatch'] === '*' && objects.has(key)) {
            throw new S3ServiceException({
              name: 'PreconditionFailed',
              $fault: 'client',
              $metadata: { httpStatusCode: 412 },
            })
          }
          const from = (input['CopySource'] as string).replace('/b/', '')
          objects.set(key, objects.get(from) ?? '')
        }
        if (cmd instanceof DeleteObjectCommand) objects.delete(key)
        return {}
      })
      const provider = makeProvider(send)
      const results = await Promise.allSettled([
        move(provider, 't/a.txt', 't/x.txt'),
        move(provider, 't/b.txt', 't/x.txt'),
      ])
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
      expect([...objects.values()].sort()).toEqual(['a', 'b'])
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
          IfNoneMatch: '*',
          CopySourceIfMatch: '"47bce5c74f589f4867dbd57e9ca9f808"',
          ACL: 'public-read',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: 'kms-key',
        },
      ])
    })
  })

  describe('createFolder', () => {
    const makeFolderProvider = () => {
      // Only `docs/taken/` is in the bucket already.
      const send = vi.fn(async (cmd: unknown) =>
        cmd instanceof ListObjectsV2Command &&
        (cmd as unknown as Cmd).input['Prefix'] === 'docs/taken/'
          ? { Contents: [{ Key: 'docs/taken/' }] }
          : { Contents: [] },
      )
      return { provider: makeProvider(send), send }
    }

    test('refuses names that already exist or are not a single segment', async () => {
      const { provider, send } = makeFolderProvider()
      const create = (parentId: string | null, name: string) =>
        provider.createFolder({
          companion: bucketCompanion(),
          parentId,
          name,
          providerUserSession: bucketSession,
        })
      await expect(create('docs/', 'taken')).rejects.toEqual(
        userError('s3AlreadyExists'),
      )
      // One listing, without a delimiter: a marker or any child is enough.
      expect(inputsOf(send, ListObjectsV2Command)).toEqual([
        { Bucket: 'b', Prefix: 'docs/taken/', MaxKeys: 1 },
      ])
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
        { Bucket: 'b', Key: 'docs/fresh/', Body: '', IfNoneMatch: '*' },
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
        {
          Bucket: 'b',
          Key: 't/x/',
          Body: '',
          IfNoneMatch: '*',
          ServerSideEncryption: 'AES256',
        },
      ])
    })
  })

  describe('transloadit-storage (native moves)', () => {
    const makeNative = (send: (cmd: unknown) => Promise<unknown> = vi.fn()) => {
      const provider = new TransloaditStorageProvider({ allowLocalUrls: true })
      vi.spyOn(provider, 'getClient').mockReturnValue({ send } as never)
      return provider
    }
    const nativeCompanion = (apiEndpoint: string) =>
      ({
        options: {
          providerOptions: {
            'transloadit-storage': {
              grantSecret: GRANT_SECRET,
              region: 'auto',
              apiEndpoint,
              workspaces: { b: { key: 'ws-key', secret: 'ws-secret' } },
            },
          },
        },
      }) as never
    const session = { bucket: 'b', prefix: 'tenant/', write: true }
    const listen = async (
      handler: Parameters<typeof createServer>[1],
    ): Promise<string> => {
      const server = createServer(handler)
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      )
      onTestFinished(
        () => new Promise<void>((resolve) => server.close(() => resolve())),
      )
      const address = server.address()
      if (address == null || typeof address === 'string') throw new Error()
      return `http://127.0.0.1:${address.port}`
    }

    test('takes grants only and uses the Workspace key for S3 calls', async () => {
      const provider = makeNative(vi.fn(async () => ({ Contents: [] })))
      const companion = nativeCompanion('http://storage.test')
      await expect(
        provider.simpleAuth({ requestBody: { form: {} }, companion }),
      ).rejects.toEqual(userError('s3InvalidGrant'))
      expect(
        await provider.list({ companion, providerUserSession: session }),
      ).toMatchObject({ session: { supportsMoveFolder: true } })
      expect(vi.mocked(provider.getClient).mock.calls[0]?.[0]).toMatchObject({
        s3: { key: 'ws-key', secret: 'ws-secret', region: 'auto' },
      })
      await expect(
        provider.list({
          companion,
          providerUserSession: { ...session, bucket: 'someone-else' },
        }),
      ).rejects.toEqual(userError('s3NotConfigured'))
    })

    test('moves files and whole folders with one signed native call', async () => {
      const requests: { url: string | undefined; body: URLSearchParams }[] = []
      const endpoint = await listen(async (request, response) => {
        let body = ''
        for await (const chunk of request) body += chunk
        const form = new URLSearchParams(body)
        requests.push({ url: request.url, body: form })
        const params = JSON.parse(form.get('params') ?? '{}')
        response.setHeader('Content-Type', 'application/json')
        response.end(
          JSON.stringify({ ok: 'DAM_ENTRY_MOVED', path: params.destination }),
        )
      })
      const send = vi.fn()
      const provider = makeNative(send)
      const companion = nativeCompanion(endpoint)
      expect(
        await provider.moveItem({
          companion,
          providerUserSession: session,
          id: 'tenant/photo.jpg',
          destination: 'tenant/renamed.jpg',
        }),
      ).toEqual({
        id: 'tenant/renamed.jpg',
        requestPath: 'tenant%2Frenamed.jpg',
      })
      expect(
        await provider.moveItem({
          companion,
          providerUserSession: session,
          id: 'tenant/album/',
          destination: 'tenant/archive',
        }),
      ).toEqual({ id: 'tenant/archive/', requestPath: 'tenant%2Farchive%2F' })
      expect(requests.map((r) => r.url)).toEqual([
        '/dam/entries/move',
        '/dam/entries/move',
      ])
      const params = requests[0]?.body.get('params') ?? ''
      expect(JSON.parse(params)).toMatchObject({
        auth: { key: 'ws-key' },
        source: 'tenant/photo.jpg',
        destination: 'tenant/renamed.jpg',
      })
      const { createHmac } = await import('node:crypto')
      expect(requests[0]?.body.get('signature')).toBe(
        `sha256:${createHmac('sha256', 'ws-secret').update(params).digest('hex')}`,
      )
      // Never S3 copy/delete, and the usual checks still apply.
      expect(send).not.toHaveBeenCalled()
      await expect(
        provider.moveItem({
          companion,
          providerUserSession: { ...session, write: false },
          id: 'tenant/photo.jpg',
          destination: 'tenant/x.jpg',
        }),
      ).rejects.toEqual(userError('s3ReadOnlySession'))
      await expect(
        provider.moveItem({
          companion,
          providerUserSession: session,
          id: 'tenant/photo.jpg',
          destination: 'other/x.jpg',
        }),
      ).rejects.toEqual(userError('s3OutsideAllowedFolder'))
      await expect(
        provider.moveItem({
          companion,
          providerUserSession: session,
          id: 'tenant/album/',
          destination: 'tenant/album/inner/',
        }),
      ).rejects.toEqual(userError('s3FolderIntoItself'))
      expect(requests).toHaveLength(2)
    })

    test('reports Storage outages as gateway errors and refusals generically', async () => {
      let status = 503
      const endpoint = await listen((_request, response) => {
        response.writeHead(status, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ error: 'private upstream diagnostic' }))
      })
      const provider = makeNative()
      const args = {
        companion: nativeCompanion(endpoint),
        providerUserSession: session,
        id: 'tenant/a.jpg',
        destination: 'tenant/b.jpg',
      }
      await expect(provider.moveItem(args)).rejects.toMatchObject({
        name: 'ProviderApiError',
        statusCode: 502,
      })
      status = 409
      await expect(provider.moveItem(args)).rejects.toEqual(
        userError('s3RequestFailed'),
      )
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
        companion: bucketCompanion(),
        providerUserSession: bucketSession,
      })
    await expect(list()).rejects.toEqual(userError('s3RequestFailed'))
    error = notFound()
    await expect(list()).rejects.toEqual(userError('s3NotFound'))
    error = new S3ServiceException({
      name: 'PreconditionFailed',
      $fault: 'client',
      $metadata: { httpStatusCode: 412 },
    })
    await expect(list()).rejects.toEqual(userError('s3Conflict'))
    error = new ProviderUserError({ message: 'passthrough' })
    await expect(list()).rejects.toEqual(userError('passthrough'))
  })
})
