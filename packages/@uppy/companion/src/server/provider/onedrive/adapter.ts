type OneDriveParentReference = { driveId: string }

type OneDriveRemoteItem = {
  id: string
  folder?: unknown
  parentReference: OneDriveParentReference
}

type OneDriveItem = {
  id: string
  name?: string
  size?: number
  file?: { mimeType?: string }
  folder?: unknown
  remoteItem?: OneDriveRemoteItem
  thumbnails?: Array<{ medium?: { url?: string } }>
  parentReference: OneDriveParentReference
  lastModifiedDateTime?: string
}

type OneDriveListResponse = {
  value: OneDriveItem[]
  '@odata.nextLink'?: string
}

const isFolder = (item: OneDriveItem): boolean => {
  if (item.remoteItem) {
    return !!item.remoteItem.folder
  }

  return !!item.folder
}

const getItemSize = (item: OneDriveItem): number | undefined => {
  return item.size
}

const getItemThumbnailUrl = (item: OneDriveItem): string | null => {
  const url = item.thumbnails?.[0]?.medium?.url
  return typeof url === 'string' ? url : null
}

const getItemIcon = (item: OneDriveItem): string | null => {
  return isFolder(item) ? 'folder' : getItemThumbnailUrl(item)
}

const getItemSubList = (item: OneDriveListResponse): OneDriveItem[] => {
  return item.value
}

const getItemName = (item: OneDriveItem): string => {
  return item.name || ''
}

const getMimeType = (item: OneDriveItem): string | null => {
  const mimeType = item.file?.mimeType
  return typeof mimeType === 'string' ? mimeType : null
}

const getItemId = (item: OneDriveItem): string => {
  if (item.remoteItem) {
    return item.remoteItem.id
  }
  return item.id
}

const getItemRequestPath = (item: OneDriveItem): string => {
  let query = `?driveId=${item.parentReference.driveId}`
  if (item.remoteItem) {
    query = `?driveId=${item.remoteItem.parentReference.driveId}`
  }
  return getItemId(item) + query
}

const getItemModifiedDate = (item: OneDriveItem): string | undefined => {
  return item.lastModifiedDateTime
}

const getNextPagePath = ({
  res,
  query: currentQuery,
  directory,
}: {
  res: OneDriveListResponse
  query: Record<string, string>
  directory: string | undefined
}): string | null => {
  const nextLink = res['@odata.nextLink']
  if (!nextLink) {
    return null
  }

  const skipToken = new URL(nextLink).searchParams.get('$skiptoken')
  if (typeof skipToken !== 'string' || skipToken.length === 0) return null

  const query = { ...currentQuery, cursor: skipToken }
  return `${directory ?? ''}?${new URLSearchParams(query).toString()}`
}

const adaptData = (
  res: OneDriveListResponse,
  username: unknown,
  query: Record<string, string>,
  directory: string | undefined,
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
      id: getItemId(item),
      thumbnail: getItemThumbnailUrl(item),
      requestPath: getItemRequestPath(item),
      modifiedDate: getItemModifiedDate(item),
      size: getItemSize(item),
    })
  })

  data.nextPagePath = getNextPagePath({ res, query, directory })

  return data
}

export default adaptData
