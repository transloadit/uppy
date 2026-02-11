import querystring from 'node:querystring'

const MEDIA_TYPES = Object.freeze({
  video: 'VIDEO',
  carousel: 'CAROUSEL_ALBUM',
  image: 'IMAGE',
})

type InstagramMedia = {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  timestamp: string
  children?: { data: InstagramMedia[] }
}

type InstagramListResponse = {
  data: InstagramMedia[]
  paging?: { cursors?: { after?: string } }
}

const isVideo = (item: InstagramMedia): boolean =>
  item.media_type === MEDIA_TYPES.video

const isFolder = (_item: InstagramMedia): boolean => {
  return false
}

const getItemIcon = (item: InstagramMedia): string | undefined => {
  return isVideo(item) ? item.thumbnail_url : item.media_url
}

const getItemSubList = (item: InstagramListResponse): InstagramMedia[] => {
  const newItems: InstagramMedia[] = []
  item.data.forEach((subItem) => {
    if (subItem.media_type === MEDIA_TYPES.carousel) {
      subItem.children?.data.forEach((i) => newItems.push(i))
    } else {
      newItems.push(subItem)
    }
  })
  return newItems
}

const getItemName = (item: InstagramMedia, index: number): string => {
  const ext = isVideo(item) ? 'mp4' : 'jpeg'
  // adding index, so the name is unique
  return `Instagram ${item.timestamp}${index}.${ext}`
}

const getMimeType = (item: InstagramMedia): string => {
  return isVideo(item) ? 'video/mp4' : 'image/jpeg'
}

const getItemId = (item: InstagramMedia): string => item.id

const getItemRequestPath = (item: InstagramMedia): string => item.id

const getItemModifiedDate = (item: InstagramMedia): string => item.timestamp

const getItemThumbnailUrl = (item: InstagramMedia): string | undefined =>
  getItemIcon(item)

const getNextPagePath = (
  data: InstagramListResponse,
  currentQuery: Record<string, string>,
  currentPath: string | undefined,
): string | null => {
  if (!data.paging || !data.paging.cursors) {
    return null
  }

  const after = data.paging.cursors.after
  if (typeof after !== 'string' || after.length === 0) return null

  const query = { ...currentQuery, cursor: after }
  return `${currentPath || ''}?${querystring.stringify(query)}`
}

const adaptData = (
  res: InstagramListResponse,
  username: unknown,
  directory: string | undefined,
  currentQuery: Record<string, string>,
): {
  username: unknown
  items: unknown[]
  nextPagePath: string | null
} => {
  const data: {
    username: unknown
    items: unknown[]
    nextPagePath: string | null
  } = { username, items: [], nextPagePath: null }
  const items = getItemSubList(res)
  items.forEach((item, i) => {
    data.items.push({
      isFolder: isFolder(item),
      icon: getItemIcon(item),
      name: getItemName(item, i),
      mimeType: getMimeType(item),
      id: getItemId(item),
      size: null,
      thumbnail: getItemThumbnailUrl(item),
      requestPath: getItemRequestPath(item),
      modifiedDate: getItemModifiedDate(item),
    })
  })

  data.nextPagePath = getNextPagePath(res, currentQuery, directory)
  return data
}

export default adaptData
