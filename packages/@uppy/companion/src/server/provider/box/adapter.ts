import querystring from 'node:querystring'
import mime from 'mime-types'
import type { BuildUrl } from '../../../types/express.js'

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
  buildURL?: BuildUrl
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
  username: string | undefined,
  companion: CompanionLike,
) {
  const items = getItemSubList(res).map((item) => ({
    isFolder: isFolder(item),
    icon: getItemIcon(item),
    name: getItemName(item),
    mimeType: getMimeType(item),
    id: getItemId(item),
    thumbnail: companion.buildURL?.(getItemThumbnailUrl(item), true),
    requestPath: getItemRequestPath(item),
    modifiedDate: getItemModifiedDate(item),
    size: getItemSize(item),
  }))

  const nextPagePath = getNextPagePath(res)

  return { username, items, nextPagePath }
}

export default adaptData
