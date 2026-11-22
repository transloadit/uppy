import nock from 'nock'
import { afterEach, expect, test, vi } from 'vitest'

import { getProtectedGot } from '../src/server/helpers/request.js'
import Facebook from '../src/server/provider/facebook/index.js'
import Unsplash from '../src/server/provider/unsplash/index.js'
import Zoom from '../src/server/provider/zoom/index.js'

// nock replaces the socket layer, so the protected agent's local-address
// check can't run here. Record which URLs go through the protected client
// instead: each URL a provider's response hands us must.
const { protectedUrls } = vi.hoisted(() => ({ protectedUrls: [] as string[] }))
vi.mock(import('../src/server/helpers/request.js'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    getProtectedGot: vi.fn((options: { allowLocalIPs: boolean }) =>
      mod.getProtectedGot(options).extend({
        hooks: {
          beforeRequest: [
            (request) => void protectedUrls.push(`${request.url}`),
          ],
        },
      }),
    ),
  }
})

const providerUserSession = { accessToken: 'token' }

afterEach(() => {
  nock.cleanAll()
  protectedUrls.length = 0
  vi.mocked(getProtectedGot).mockClear()
})

test('a Facebook media URL is downloaded through the protected client', async () => {
  nock('https://graph.facebook.com')
    .post('/')
    .reply(200, [
      {
        code: 200,
        body: JSON.stringify({
          images: [{ source: 'https://media.test/photo.jpg', width: 1 }],
        }),
      },
    ])
  nock('https://media.test').get('/photo.jpg').reply(200, 'photo')
  const { stream } = await new Facebook({ allowLocalUrls: false }).download({
    companion: { getProviderCredentials: async () => ({ secret: 'secret' }) },
    id: 'photo',
    providerUserSession,
  } as never)
  stream.destroy()
  expect(getProtectedGot).toHaveBeenCalledWith({ allowLocalIPs: false })
  expect(protectedUrls).toEqual(['https://media.test/photo.jpg'])
})

test('both Unsplash download URLs go through the protected client', async () => {
  nock('https://api.unsplash.com')
    .get('/photos/photo')
    .reply(200, {
      links: { download_location: 'https://attribution.test/photo' },
    })
  // Unsplash only counts an authenticated attribution request
  nock('https://attribution.test', {
    reqheaders: { authorization: 'Client-ID token' },
  })
    .get('/photo')
    .reply(200, { url: 'https://images.test/photo.jpg' })
  nock('https://images.test').get('/photo.jpg').reply(200, 'photo')
  const { stream } = await new Unsplash({ allowLocalUrls: false }).download({
    id: 'photo',
    providerUserSession,
  } as never)
  stream.destroy()
  expect(getProtectedGot).toHaveBeenCalledWith({ allowLocalIPs: false })
  expect(protectedUrls).toEqual([
    'https://attribution.test/photo',
    'https://images.test/photo.jpg',
  ])
})

test('a Zoom recording URL is downloaded through the protected client', async () => {
  nock('https://zoom.us')
    .get('/v2/meetings/meeting/recordings')
    .reply(200, {
      recording_files: [
        {
          id: 'file',
          download_url: 'https://recordings.test/file.mp4',
          file_size: 5,
        },
      ],
    })
  nock('https://recordings.test')
    .get('/file.mp4')
    .query(true)
    .reply(200, 'video')
  const { stream } = await new Zoom({ allowLocalUrls: false }).download({
    id: 'meeting',
    providerUserSession,
    query: { recordingId: 'file' },
  } as never)
  stream.destroy()
  expect(getProtectedGot).toHaveBeenCalledWith({ allowLocalIPs: false })
  expect(protectedUrls).toEqual([
    'https://recordings.test/file.mp4?access_token=token',
  ])
})
