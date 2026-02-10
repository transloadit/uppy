import querystring from 'node:querystring'

type FacebookImage = { width: number; source: string }

type FacebookAlbum = {
  type?: string
  id: string | number
  name?: string
  created_time?: string
}

type FacebookPhoto = {
  id: string | number
  name?: string
  created_time?: string
  images: FacebookImage[]
}

type FacebookItem = FacebookAlbum | FacebookPhoto

type FacebookListResponse = {
  data: FacebookItem[]
  paging?: {
    cursors?: {
      after?: string
    }
  }
}

const isFolder = (item: FacebookItem): item is FacebookAlbum => {
  return 'type' in item && typeof item.type === 'string' && item.type.length > 0
}

export const sortImages = (images: FacebookImage[]): FacebookImage[] => {
  // sort in ascending order of dimension
  return images.slice().sort((a, b) => a.width - b.width)
}

const getItemIcon = (item: FacebookItem): string | undefined => {
  if (isFolder(item)) {
    return 'folder'
  }
  return sortImages(item.images)[0]?.source
}

const getItemSubList = (item: FacebookListResponse): FacebookItem[] => {
  return item.data
}

const getItemName = (item: FacebookItem): string => {
  return item.name || `${item.id} ${item.created_time}`
}

const getMimeType = (item: FacebookItem): string | null => {
  return isFolder(item) ? null : 'image/jpeg'
}

const getItemId = (item: FacebookItem): string => {
  return `${item.id}`
}

const getItemRequestPath = (item: FacebookItem): string => {
  return `${item.id}`
}

const getItemModifiedDate = (item: FacebookItem): string | undefined => {
  return item.created_time
}

const getItemThumbnailUrl = (item: FacebookItem): string | null => {
  return isFolder(item) ? null : sortImages(item.images)[0]?.source ?? null
}

const getNextPagePath = (
  data: FacebookListResponse,
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

export const adaptData = (
  res: FacebookListResponse,
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
  items.forEach((item) => {
    data.items.push({
      isFolder: isFolder(item),
      icon: getItemIcon(item),
      name: getItemName(item),
      mimeType: getMimeType(item),
      size: null,
      id: getItemId(item),
      thumbnail: getItemThumbnailUrl(item),
      requestPath: getItemRequestPath(item),
      modifiedDate: getItemModifiedDate(item),
    })
  })

  data.nextPagePath = getNextPagePath(res, currentQuery, directory)
  return data
}
