import querystring from 'node:querystring'
import mime from 'mime-types'

type BoxItem = {
  type?: string
  size?: number
  entries?: BoxItem[]
  name?: string
  id: string
  modified_at?: string
}

type BoxListResponse = {
  entries: BoxItem[]
  total_count: number
  limit: number
  offset: number
}

type CompanionLike = {
  buildURL: (
    subPath: string,
    isExternal: boolean,
    excludeHost?: boolean,
  ) => string
}

const isFolder = (item: BoxItem): boolean => {
  return item.type === 'folder'
}

const getItemSize = (item: BoxItem): number | undefined => {
  return item.size
}

const getItemIcon = (item: BoxItem): string | undefined => {
  return item.type
}

const getItemSubList = (item: BoxListResponse): BoxItem[] => {
  return item.entries
}

const getItemName = (item: BoxItem): string => {
  return item.name || ''
}

const getMimeType = (item: BoxItem): string | null => {
  const mt = mime.lookup(getItemName(item))
  return typeof mt === 'string' ? mt : null
}

const getItemId = (item: BoxItem): string => {
  return item.id
}

const getItemRequestPath = (item: BoxItem): string => {
  return item.id
}

const getItemModifiedDate = (item: BoxItem): string | undefined => {
  return item.modified_at
}

const getItemThumbnailUrl = (item: BoxItem): string => {
  return `/box/thumbnail/${getItemRequestPath(item)}`
}

const getNextPagePath = (data: BoxListResponse): string | null => {
  if (
    data.total_count < data.limit ||
    data.offset + data.limit > data.total_count
  ) {
    return null
  }
  const query = { cursor: data.offset + data.limit }
  return `?${querystring.stringify(query)}`
}

const adaptData = function adaptData(
  res: BoxListResponse,
  username: unknown,
  companion: CompanionLike,
): {
  username: unknown
  items: unknown[]
  nextPagePath: string | null
} {
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
      id: getItemId(item),
      thumbnail: companion.buildURL(getItemThumbnailUrl(item), true),
      requestPath: getItemRequestPath(item),
      modifiedDate: getItemModifiedDate(item),
      size: getItemSize(item),
    })
  })

  data.nextPagePath = getNextPagePath(res)

  return data
}

export default adaptData
