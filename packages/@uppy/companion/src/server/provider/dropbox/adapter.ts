import querystring from 'node:querystring'
import mime from 'mime-types'

type DropboxItem = {
  '.tag'?: string
  size?: number
  name?: string
  id: string
  path_lower: string
  server_modified?: string
}

type DropboxListResponse = {
  entries: DropboxItem[]
  has_more: boolean
  cursor?: string
}

type BuildURL = (
  subPath: string,
  isExternal: boolean,
  excludeHost?: boolean,
) => string

const isFolder = (item: DropboxItem): boolean => {
  return item['.tag'] === 'folder'
}

const getItemSize = (item: DropboxItem): number | undefined => {
  return item.size
}

const getItemIcon = (item: DropboxItem): string | undefined => {
  return item['.tag']
}

const getItemSubList = (item: DropboxListResponse): DropboxItem[] => {
  return item.entries
}

const getItemName = (item: DropboxItem): string => {
  return item.name || ''
}

const getMimeType = (item: DropboxItem): string | null => {
  const mt = mime.lookup(getItemName(item))
  return typeof mt === 'string' ? mt : null
}

const getItemId = (item: DropboxItem): string => {
  return item.id
}

const getItemRequestPath = (item: DropboxItem): string => {
  return encodeURIComponent(item.path_lower)
}

const getItemModifiedDate = (item: DropboxItem): string | undefined => {
  return item.server_modified
}

const getItemThumbnailUrl = (item: DropboxItem): string => {
  return `/dropbox/thumbnail/${getItemRequestPath(item)}`
}

const getNextPagePath = (data: DropboxListResponse): string | null => {
  if (!data.has_more) {
    return null
  }
  const query = { cursor: data.cursor }
  return `?${querystring.stringify(query)}`
}

const adaptData = (
  res: DropboxListResponse,
  email: string | undefined,
  buildURL: BuildURL,
): {
  username: string | undefined
  items: Array<{
    isFolder: boolean
    icon: string | undefined
    name: string
    mimeType: string | null
    id: string
    thumbnail: string
    requestPath: string
    modifiedDate: string | undefined
    size: number | undefined
  }>
  nextPagePath: string | null
} => {
  const items = getItemSubList(res).map((item) => ({
    isFolder: isFolder(item),
    icon: getItemIcon(item),
    name: getItemName(item),
    mimeType: getMimeType(item),
    id: getItemId(item),
    thumbnail: buildURL(getItemThumbnailUrl(item), true),
    requestPath: getItemRequestPath(item),
    modifiedDate: getItemModifiedDate(item),
    size: getItemSize(item),
  }))
  items.sort((a, b) => a.name.localeCompare(b.name, 'en-US', { numeric: true }))

  return {
    username: email,
    items,
    nextPagePath: getNextPagePath(res),
  }
}

export default adaptData
