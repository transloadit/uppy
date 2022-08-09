const { Readable } = require('node:stream')

const BASE_URL = 'https://api.unsplash.com'

function adaptData (res) {
  const data = {
    username: null,
    items: [],
    nextPagePath: null,
  }

  const items = res
  items.forEach((item) => {
    const isFolder = !!item.published_at
    data.items.push({
      isFolder,
      icon: isFolder ? item.cover_photo.urls.thumb : item.urls.thumb,
      name: item.title || item.description,
      mimeType: isFolder ? null : 'image/jpeg',
      id: item.id,
      thumbnail: isFolder ? item.cover_photo.urls.thumb : item.urls.thumb,
      requestPath: item.id,
      modifiedDate: item.updated_at,
      size: null,
    })
  })

  return data
}

/**
 * an example of a custom provider module. It implements @uppy/companion's Provider interface
 */
class MyCustomProvider {
  static version = 2

  authProvider = 'myunsplash'

  // eslint-disable-next-line class-methods-use-this
  async list ({ token, directory }) {
    const path = directory ? `/${directory}/photos` : ''

    const resp = await fetch(`${BASE_URL}/collections${path}`, {
      headers:{
        Authorization: `Bearer ${token}`,
      },
    })
    if (!resp.ok) {
      throw new Error(`Errornous HTTP response (${resp.status} ${resp.statusText})`)
    }
    return adaptData(await resp.json())
  }

  // eslint-disable-next-line class-methods-use-this
  async download ({ id, token }) {
    const resp = await fetch(`${BASE_URL}/photos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!resp.ok) {
      throw new Error(`Errornous HTTP response (${resp.status} ${resp.statusText})`)
    }
    return { stream: Readable.fromWeb(resp.body) }
  }

  // eslint-disable-next-line class-methods-use-this
  async size ({ id, token }) {
    const resp = await fetch(`${BASE_URL}/photos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!resp.ok) {
      throw new Error(`Errornous HTTP response (${resp.status} ${resp.statusText})`)
    }

    const { size } = await resp.json()
    return size
  }
}

module.exports = MyCustomProvider
