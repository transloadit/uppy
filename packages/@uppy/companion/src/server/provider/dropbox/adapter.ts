import type { BuildUrl } from '../../../types/express.js'
import type { ProviderListResponse } from '../Provider.js'

import mime from 'mime-types'

import { getNextPagePath } from '../../helpers/utils.js'

type DropboxItem = {
  '.tag'?: string
  size?: number
  name?: string
  id: string
  // absent for items not mounted in the user's Dropbox, e.g. unmounted shared folders
  path_lower?: string
  server_modified?: string
}

type DropboxListResponse = {
  entries: DropboxItem[]
  has_more: boolean
  cursor?: string
}

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

type MountedDropboxItem = DropboxItem & { path_lower: string }

const getItemRequestPath = (item: MountedDropboxItem): string => {
  return encodeURIComponent(item.path_lower)
}

const getItemModifiedDate = (item: DropboxItem): string | undefined => {
  return item.server_modified
}

const getItemThumbnailUrl = (item: MountedDropboxItem): string => {
  return `/dropbox/thumbnail/${getItemRequestPath(item)}`
}

const getDropboxNextPagePath = (data: DropboxListResponse): string | null =>
  data.has_more ? getNextPagePath('', {}, data.cursor) : null

const adaptData = (
  res: DropboxListResponse,
  email: string | undefined,
  buildURL: BuildUrl,
): ProviderListResponse => {
  // Items without a path (search can return these) can't be browsed or
  // addressed by path, so we leave them out.
  const items = getItemSubList(res)
    .filter((item): item is MountedDropboxItem => item.path_lower != null)
    .map((item) => ({
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
    nextPagePath: getDropboxNextPagePath(res),
  }
}

export default adaptData
