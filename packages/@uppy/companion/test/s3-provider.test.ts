import { Readable } from 'node:stream'
import { describe, expect, test, vi } from 'vitest'
import S3Provider from '../src/server/provider/s3/index.js'

const makeProvider = (send: (cmd: unknown) => Promise<unknown> = vi.fn()) => {
  const provider = new S3Provider({ allowLocalUrls: false })
  vi.spyOn(provider, 'getClient').mockReturnValue({ send } as never)
  return provider
}

const companionWith = (browsableBuckets?: string[]) =>
  ({ options: { s3: { browsableBuckets } } }) as never

describe('S3 provider', () => {
  test('simpleAuth parses "bucket", "bucket/prefix" and "s3://bucket/prefix"', async () => {
    const provider = makeProvider()
    await expect(
      provider.simpleAuth({ requestBody: { form: { bucket: 'my-bucket' } } }),
    ).resolves.toEqual({ bucket: 'my-bucket', prefix: '' })
    await expect(
      provider.simpleAuth({
        requestBody: { form: { bucket: 's3://my-bucket/some/prefix' } },
      }),
    ).resolves.toEqual({ bucket: 'my-bucket', prefix: 'some/prefix/' })
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
})
