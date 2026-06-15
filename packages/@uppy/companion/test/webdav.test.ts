import { beforeEach, describe, expect, test, vi } from 'vitest'
import WebdavProvider from '../src/server/provider/webdav/index.js'

// Build a WebdavProvider whose getClientHelper is stubbed so we never touch the
// network or the real `webdav` client. Each stubbed client's `stat()` succeeds
// only for URLs that `respondsAsWebdav` accepts; for any other URL it throws the
// same way the real client does when it hits a non-WebDAV (HTML) endpoint.
function setup(respondsAsWebdav: (url: string) => boolean) {
  const provider = new WebdavProvider({ allowLocalUrls: true })
  const createdUrls: string[] = []

  vi.spyOn(provider, 'getClientHelper').mockImplementation(
    // @ts-expect-error returning a partial client is enough for these tests
    async ({ url }: { url: string }) => {
      createdUrls.push(url)
      return {
        stat: async () => {
          if (respondsAsWebdav(url)) return { type: 'directory', size: 0 }
          throw new Error('Invalid response: No root multistatus found')
        },
        getDirectoryContents: async () => [],
        createReadStream: () => undefined,
      }
    },
  )

  return { provider, createdUrls }
}

describe('WebdavProvider public share link resolution', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('uses /public.php/webdav/ for Nextcloud / ownCloud public links', async () => {
    const { provider, createdUrls } = setup((url) =>
      url.includes('/public.php/webdav/'),
    )

    const { url } = await provider.getPublicLinkClient({
      providerUserSession: {
        webdavUrl: 'https://nextcloud.example.com/s/TOKEN123',
      },
    })

    expect(url).toBe('https://nextcloud.example.com/public.php/webdav/')
    // the first candidate works, so the oCIS endpoint is never probed
    expect(createdUrls).not.toContain(
      'https://nextcloud.example.com/dav/public-files/TOKEN123',
    )
  })

  test('falls back to /dav/public-files/<token> for oCIS public links', async () => {
    const { provider, createdUrls } = setup((url) =>
      url.includes('/dav/public-files/'),
    )

    const { url } = await provider.getPublicLinkClient({
      providerUserSession: {
        webdavUrl: 'https://ocis.example.com/s/TOKEN123',
      },
    })

    expect(url).toBe('https://ocis.example.com/dav/public-files/TOKEN123')
    // the ownCloud/Nextcloud path is probed first, then oCIS
    expect(createdUrls).toEqual([
      'https://ocis.example.com/public.php/webdav/',
      'https://ocis.example.com/dav/public-files/TOKEN123',
    ])
  })

  test('reuses the cached publicLinkUrl without probing again', async () => {
    const { provider, createdUrls } = setup(() => true)

    const { url } = await provider.getPublicLinkClient({
      providerUserSession: {
        webdavUrl: 'https://ocis.example.com/s/TOKEN123',
        publicLinkUrl: 'https://ocis.example.com/dav/public-files/TOKEN123',
      },
    })

    expect(url).toBe('https://ocis.example.com/dav/public-files/TOKEN123')
    expect(createdUrls).toEqual([
      'https://ocis.example.com/dav/public-files/TOKEN123',
    ])
  })

  test('falls back to the default endpoint when no candidate responds as WebDAV', async () => {
    const { provider, createdUrls } = setup(() => false)

    const { url } = await provider.getPublicLinkClient({
      providerUserSession: {
        webdavUrl: 'https://unknown.example.com/s/TOKEN123',
      },
    })

    expect(url).toBe('https://unknown.example.com/public.php/webdav/')
    expect(createdUrls).toEqual([
      'https://unknown.example.com/public.php/webdav/',
      'https://unknown.example.com/dav/public-files/TOKEN123',
      // final fall-back client for the default endpoint
      'https://unknown.example.com/public.php/webdav/',
    ])
  })

  test('strips a trailing /index.php from the base url', async () => {
    const { provider } = setup((url) => url.includes('/public.php/webdav/'))

    const { url } = await provider.getPublicLinkClient({
      providerUserSession: {
        webdavUrl: 'https://oc10.example.com/index.php/s/TOKEN123',
      },
    })

    expect(url).toBe('https://oc10.example.com/public.php/webdav/')
  })

  test('throws on a public link url without a token', async () => {
    const { provider } = setup(() => true)

    await expect(
      provider.getPublicLinkClient({
        providerUserSession: { webdavUrl: 'https://example.com/s/' },
      }),
    ).rejects.toThrow('invalid public link url')
  })
})
