const got = require('../../../got')

const { logout, refreshToken } = require('../index')
const { withGoogleErrorHandling } = require('../../providerErrors')
const { prepareStream } = require('../../../helpers/utils')
const { MAX_AGE_REFRESH_TOKEN } = require('../../../helpers/jwt')
const logger = require('../../../logger')
const Provider = require('../../Provider')


const getBaseClient = async ({ token }) => (await got).extend({
  headers: {
    authorization: `Bearer ${token}`,
  },
})

const getPhotosClient = async ({ token }) => (await getBaseClient({ token })).extend({
  prefixUrl: 'https://photoslibrary.googleapis.com/v1',
})

const getOauthClient = async ({ token }) => (await getBaseClient({ token })).extend({
  prefixUrl: 'https://www.googleapis.com/oauth2/v1',
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
class GooglePhotos extends Provider {
  static get oauthProvider () {
    return 'googlephotos'
  }

  static get authStateExpiry () {
    return MAX_AGE_REFRESH_TOKEN
  }

  // eslint-disable-next-line class-methods-use-this
  async list (options) {
    return withGoogleErrorHandling(GooglePhotos.oauthProvider, 'provider.photos.list.error', async () => {
      const { directory, query } = options
      const { token } = options

      const isRoot = !directory

      const client = await getPhotosClient({ token })


      async function fetchAlbums () {
        if (!isRoot) return [] // albums are only in the root

        return paginate(
          (pageToken) => client.get('albums', { searchParams: { pageToken, pageSize: 50 }, responseType: 'json' }).json(),
          (response) => response.albums ?? [], // seems to be undefined if no albums
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

      // mediaItems seems to be undefined if empty folder
      const [sharedAlbums, albums, { mediaItems = [], nextPageToken }] = await Promise.all([
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
          icon: 'https://drive-thirdparty.googleusercontent.com/32/type/application/vnd.google-apps.folder',
          mimeType: 'application/vnd.google-apps.folder',
          thumbnail: getThumbnail(album.coverPhotoBaseUrl),
          name: album.title,
          id: album.id,
          requestPath: album.id,
        })),
        ...sharedAlbums.map((sharedAlbum) => ({
          isFolder: true,
          icon: 'https://drive-thirdparty.googleusercontent.com/32/type/application/vnd.google-apps.folder',
          mimeType: 'application/vnd.google-apps.folder',
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

      const { email: username } = await (await getOauthClient({ token })).get('userinfo').json()

      return {
        username,
        items: adaptedItems,
        nextPagePath: newSp.size > 0 ? `${directory ?? ''}?${newSp.toString()}` : null,
      }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async download ({ id, token }) {
    return withGoogleErrorHandling(GooglePhotos.oauthProvider, 'provider.photos.download.error', async () => {
      const client = await getPhotosClient({ token })

      const { baseUrl } = await client.get(`mediaItems/${encodeURIComponent(id)}`, { responseType: 'json' }).json()

      const url = `${baseUrl}=d`;
      const stream = (await got).stream.get(url, { responseType: 'json' })
      const { size } = await prepareStream(stream)

      return { stream, size }
    })
  }
}

GooglePhotos.prototype.logout = logout
GooglePhotos.prototype.refreshToken = refreshToken

module.exports = GooglePhotos
