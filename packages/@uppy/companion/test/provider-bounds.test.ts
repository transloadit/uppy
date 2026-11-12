import nock from 'nock'
import { afterEach, describe, expect, test } from 'vitest'
import Box from '../src/server/provider/box/index.js'
import adaptDropbox from '../src/server/provider/dropbox/adapter.js'
import { Drive } from '../src/server/provider/google/drive/index.js'
import OneDrive from '../src/server/provider/onedrive/index.js'

afterEach(() => nock.cleanAll())

describe('provider listing bounds', () => {
  test.each([
    [
      new Box({ allowLocalUrls: false }),
      { directory: '..' },
      'https://api.box.com',
    ],
    [
      new OneDrive({ allowLocalUrls: false }),
      { query: { driveId: '..' } },
      'https://graph.microsoft.com',
    ],
  ])('rejects invalid paths before starting a user-info request (%s)', async (provider, options, origin) => {
    const upstream = nock(origin).get(/.*/).reply(401, {})
    await expect(
      provider.list({
        ...options,
        companion: {} as never,
        providerUserSession: { accessToken: 'expired-token' },
      }),
    ).rejects.toThrow('Invalid id')
    expect(upstream.isDone()).toBe(false)
  })

  test('sorts bounded normalized keys while retaining original Dropbox names', () => {
    const marked = `a${'\u0301'.repeat(10000)}`
    const data = adaptDropbox(
      {
        has_more: false,
        entries: [
          { id: 'ten', path_lower: '/file10', name: 'file10' },
          { id: 'two', path_lower: '/file2', name: 'file2' },
          { id: 'marked', path_lower: '/marked', name: marked },
        ],
      },
      'user',
      (path) => path,
    )
    expect(data.items.map((item) => item.name)).toEqual([
      marked,
      'file2',
      'file10',
    ])
  })

  test('paginates shared drives without duplicating files or losing their cursor', async () => {
    const api = nock('https://www.googleapis.com')
      .get('/drive/v3/about')
      .query(true)
      .times(3)
      .reply(200, { user: {} })
      .get('/drive/v3/drives')
      .query((q) => !q['pageToken'])
      .reply(200, {
        drives: [{ id: 'drive1', kind: 'drive#drive', name: 'Drive 1' }],
        nextPageToken: 'next-drive',
      })
      .get('/drive/v3/drives')
      .query((q) => q['pageToken'] === 'next-drive')
      .reply(200, {
        drives: [{ id: 'drive2', kind: 'drive#drive', name: 'Drive 2' }],
      })
      .get('/drive/v3/files')
      .query((q) => !q['pageToken'])
      .reply(200, {
        files: [{ id: 'file1', name: 'File 1' }],
        nextPageToken: 'next-file',
      })
      .get('/drive/v3/files')
      .query((q) => q['pageToken'] === 'next-file')
      .reply(200, {
        files: [{ id: 'file2', name: 'File 2' }],
      })
    const provider = new Drive({ allowLocalUrls: false })
    const list = (query = {}) =>
      provider.list({
        directory: 'root',
        query,
        companion: {} as never,
        providerUserSession: { accessToken: 'token' },
      })
    const first = await list()
    expect(first.items.map((item) => item.id)).toEqual([
      'shared-with-me',
      'drive1',
      'file1',
    ])
    expect(first.nextPagePath).toBe(
      'root?sharedDriveCursor=next-drive&fileCursor=next-file',
    )
    const second = await list({
      sharedDriveCursor: 'next-drive',
      fileCursor: 'next-file',
    })
    expect(second.items.map((item) => item.id)).toEqual(['drive2'])
    expect(second.nextPagePath).toBe('root?cursor=next-file')
    const third = await list({ cursor: 'next-file' })
    expect(third.items.map((item) => item.id)).toEqual(['file2'])
    expect(third.nextPagePath).toBe(null)
    expect(api.isDone()).toBe(true)
  })

  test('escapes Google Drive parent ids as query literals', async () => {
    const api = nock('https://www.googleapis.com')
      .get('/drive/v3/about')
      .query(true)
      .reply(200, { user: {} })
      .get('/drive/v3/files')
      .query((q) => q['q'] === "('a\\'b\\\\c' in parents) and trashed=false")
      .reply(200, { files: [] })
    await new Drive({ allowLocalUrls: false }).list({
      directory: "a'b\\c",
      companion: {} as never,
      providerUserSession: { accessToken: 'token' },
    })
    expect(api.isDone()).toBe(true)
  })
})
