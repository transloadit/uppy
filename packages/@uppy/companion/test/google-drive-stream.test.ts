import nock from 'nock'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  getProtectedGot,
  UPSTREAM_TIMEOUTS,
} from '../src/server/helpers/request.js'
import { streamGoogleFile } from '../src/server/provider/google/drive/index.js'
import * as defaults from './fixtures/constants.js'

vi.mock(import('../src/server/helpers/request.js'), async (importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, getProtectedGot: vi.fn(mod.getProtectedGot) }
})

const nockStats = (stats: Record<string, unknown>) =>
  nock('https://www.googleapis.com')
    .get(`/drive/v3/files/${defaults.ITEM_ID}`)
    .query(true)
    .reply(200, { kind: 'drive#file', id: defaults.ITEM_ID, ...stats })

describe('streamGoogleFile', () => {
  afterEach(() => {
    nock.cleanAll()
    vi.mocked(getProtectedGot).mockClear()
  })

  test('falls back to the metadata size when the download has no Content-Length', async () => {
    nockStats({ mimeType: 'video/mp4', size: String(defaults.FILE_SIZE) })
    nock('https://www.googleapis.com')
      .get(`/drive/v3/files/${defaults.ITEM_ID}`)
      .query({ alt: 'media', supportsAllDrives: 'true' })
      .reply(200, 'file contents')

    const { stream, size } = await streamGoogleFile({
      token: 'DUMMY-TOKEN',
      id: defaults.ITEM_ID,
      allowLocalUrls: false,
    })
    stream.destroy()

    expect(size).toBe(defaults.FILE_SIZE)
  })

  test('prefers the Content-Length of the download', async () => {
    nockStats({ mimeType: 'video/mp4', size: String(defaults.FILE_SIZE) })
    nock('https://www.googleapis.com')
      .get(`/drive/v3/files/${defaults.ITEM_ID}`)
      .query({ alt: 'media', supportsAllDrives: 'true' })
      .reply(200, 'file contents', { 'Content-Length': '13' })

    const { stream, size } = await streamGoogleFile({
      token: 'DUMMY-TOKEN',
      id: defaults.ITEM_ID,
      allowLocalUrls: false,
    })
    stream.destroy()

    expect(size).toBe(13)
  })

  test('leaves the size unknown for exported Google Workspace files', async () => {
    nockStats({
      mimeType: 'application/vnd.google-apps.document',
      size: '1024',
    })
    nock('https://www.googleapis.com')
      .get(`/drive/v3/files/${defaults.ITEM_ID}/export`)
      .query(true)
      .reply(200, 'exported contents')

    const { stream, size } = await streamGoogleFile({
      token: 'DUMMY-TOKEN',
      id: defaults.ITEM_ID,
      allowLocalUrls: false,
    })
    stream.destroy()

    expect(size).toBeUndefined()
  })

  test('an export link is downloaded with the local-address protection', async () => {
    const link = 'https://docs.google.com/feeds/download/documents/export'
    nockStats({
      mimeType: 'application/vnd.google-apps.document',
      exportLinks: {
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          link,
      },
    })
    nock('https://docs.google.com')
      .get('/feeds/download/documents/export')
      .reply(200, 'exported')

    const { stream } = await streamGoogleFile({
      token: 'DUMMY-TOKEN',
      id: defaults.ITEM_ID,
      allowLocalUrls: false,
    })
    const { timeout } = (stream as unknown as { options: { timeout: object } })
      .options
    stream.destroy()

    expect(getProtectedGot).toHaveBeenCalledWith({ allowLocalIPs: false })
    // large exports may take long before Google answers; connecting stays bounded
    expect(timeout).toMatchObject({
      response: undefined,
      connect: UPSTREAM_TIMEOUTS.connect,
    })
  })
})
