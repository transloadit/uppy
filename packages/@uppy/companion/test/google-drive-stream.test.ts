import nock from 'nock'
import { afterEach, describe, expect, test } from 'vitest'
import { streamGoogleFile } from '../src/server/provider/google/drive/index.js'
import * as defaults from './fixtures/constants.js'

const nockStats = (stats: Record<string, unknown>) =>
  nock('https://www.googleapis.com')
    .get(`/drive/v3/files/${defaults.ITEM_ID}`)
    .query(true)
    .reply(200, { kind: 'drive#file', id: defaults.ITEM_ID, ...stats })

describe('streamGoogleFile', () => {
  afterEach(() => {
    nock.cleanAll()
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
    })
    stream.destroy()

    expect(size).toBeUndefined()
  })
})
