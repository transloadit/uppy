import { Readable } from 'node:stream'
import type { ProviderListResponse } from '@uppy/companion'

const BASE_URL = 'https://api.unsplash.com'

function adaptData(items: any[]) {
  const data: ProviderListResponse = {
    username: null,
    items: [],
    nextPagePath: null,
  }

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
export default class MyCustomProvider {
  static version = 2

  oauthProvider = 'myunsplash'

  async list({
    token,
    directory,
  }: {
    token: string
    directory?: string | undefined
  }) {
    const path = directory ? `/${directory}/photos` : ''

    const resp = await fetch(`${BASE_URL}/collections${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!resp.ok) {
      throw new Error(
        `Errornous HTTP response (${resp.status} ${resp.statusText})`,
      )
    }
    return adaptData((await resp.json()) as any[])
  }

  async download({ id, token }: { id: string; token: string }) {
    const resp = await fetch(`${BASE_URL}/photos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const contentLengthStr = resp.headers.get('content-length')!
    const contentLength = parseInt(contentLengthStr, 10)
    const size =
      !Number.isNaN(contentLength) && contentLength >= 0
        ? contentLength
        : undefined

    if (!resp.ok) {
      throw new Error(
        `Errornous HTTP response (${resp.status} ${resp.statusText})`,
      )
    }
    return { stream: Readable.fromWeb(resp.body!), size }
  }
}
