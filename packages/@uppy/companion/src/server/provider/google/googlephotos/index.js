const got = require('got').default

const GoogleProvider = require('../index')
const { withProviderErrorHandling } = require('../../providerErrors')
const { prepareStream } = require('../../../helpers/utils')
const { MAX_AGE_REFRESH_TOKEN } = require('../../../helpers/jwt')
const logger = require('../../../logger')


const getClient = ({ token }) => got.extend({
  prefixUrl: 'https://photoslibrary.googleapis.com/v1',
  headers: {
    authorization: `Bearer ${token}`,
  },
})

async function paginate(fn, getter, limit = 5) {
  const items = []
  let pageToken

  for (let i = 0; (i === 0 || pageToken != null); i++) {
    if (i >= limit) {
      logger.warn(`Hit pagination limit of ${limit}`)
      break;
    }
    const response = await fn(pageToken);
    items.push(...getter(response));
    pageToken = response.nextPageToken
  }
  return items
}

/**
 * Provider for Google Photos API
 */
class GooglePhotos extends GoogleProvider {
  static get authProvider () {
    return 'googlephotos'
  }

  static get authStateExpiry () {
    return MAX_AGE_REFRESH_TOKEN
  }

  async list (options) {
    return this.#withErrorHandling('provider.photos.list.error', async () => {
      const { directory, query } = options
      const { token } = options

      const isRoot = !directory

      const client = getClient({ token })


      async function fetchAlbums () {
        if (!isRoot) return [] // albums are only in the root

        return paginate(
          (pageToken) => client.get('albums', { searchParams: { pageToken, pageSize: 50 }, responseType: 'json' }).json(),
          (response) => response.albums,
        )
      }

      async function fetchSharedAlbums () {
        if (!isRoot) return [] // albums are only in the root

        return paginate(
          (pageToken) => client.get('sharedAlbums', { searchParams: { pageToken, pageSize: 50 }, responseType: 'json' }).json(),
          (response) => response.sharedAlbums ?? [], // seems to be undefined if no shared albums
        )
      }

      async function fetchMediaItems () {
        if (isRoot) return { mediaItems: [] } // no images in root (album list only)
        const resp = await client.post('mediaItems:search', { json: { pageToken: query?.cursor, albumId: directory, pageSize: 50 }, responseType: 'json' }).json();
        return resp
      }

      const [sharedAlbums, albums, { mediaItems, nextPageToken }] = await Promise.all([
        fetchSharedAlbums(), fetchAlbums(), fetchMediaItems()
      ])

      const newSp = new URLSearchParams(Object.entries(query));
      if (nextPageToken) newSp.set('cursor', nextPageToken);

      const iconSize = 64
      const thumbSize = 300
      const getIcon = (baseUrl) => `${baseUrl}=w${iconSize}-h${iconSize}-c`
      const getThumbnail = (baseUrl) => `${baseUrl}=w${thumbSize}-h${thumbSize}-c`
      const adaptedItems = [
        ...albums.map((album) => ({
          isFolder: true,
          icon: getIcon(album.coverPhotoBaseUrl),
          thumbnail: getThumbnail(album.coverPhotoBaseUrl),
          name: album.title,
          id: album.id,
          requestPath: album.id,
        })),
        ...sharedAlbums.map((sharedAlbum) => ({
          isFolder: true,
          icon: getIcon(sharedAlbum.coverPhotoBaseUrl),
          thumbnail: getThumbnail(sharedAlbum.coverPhotoBaseUrl),
          name: sharedAlbum.title,
          id: sharedAlbum.id,
          requestPath: sharedAlbum.id,
        })),
        ...mediaItems.map((mediaItem) => ({
          isFolder: false,
          icon: getIcon(mediaItem.baseUrl),
          thumbnail: getThumbnail(mediaItem.baseUrl),
          name: mediaItem.filename,
          id: mediaItem.id,
          mimeType: mediaItem.mimeType,
          modifiedDate: mediaItem.creationTime,
          requestPath: mediaItem.id,
          custom: {
            imageWidth: mediaItem.photo ? mediaItem.width : undefined,
            imageHeight: mediaItem.photo ? mediaItem.height : undefined,
            videoWidth: mediaItem.video ? mediaItem.width : undefined,
            videoHeight: mediaItem.video ? mediaItem.height : undefined,
          },
        })),
      ];

      return {
        // Google Photos does not provide a username API. We could get it from
        // https://people.googleapis.com/v1/people/me?personFields=names however it requires an additional scope
        username: undefined,
        items: adaptedItems,
        nextPagePath: newSp.size > 0 ? `${directory ?? ''}?${newSp.toString()}` : null,
      }
    })
  }

  async download ({ id, token }) {
    return this.#withErrorHandling('provider.photos.download.error', async () => {
      const client = getClient({ token })

      const { baseUrl } = await client.get(`mediaItems/${encodeURIComponent(id)}`, { responseType: 'json' }).json()

      const url = `${baseUrl}=d`;
      const stream = got.stream.get(url, { responseType: 'json' })
      const { size } = await prepareStream(stream)

      return { stream, size }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async #withErrorHandling (tag, fn) {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: GooglePhotos.authProvider,
      isAuthError: (response) => (
        response.statusCode === 401
        || (response.statusCode === 400 && response.body?.error === 'invalid_grant') // Refresh token has expired or been revoked
      ),
      getJsonErrorMessage: (body) => body?.error?.message,
    })
  }
}

module.exports = GooglePhotos
