const isFolder = (item) => {
  if (item.remoteItem) {
    return !!item.remoteItem.folder
  }

  return !!item.folder
}

const getItemSize = (item) => {
  return item.size
}

const getItemThumbnailUrl = (item) => {
  return item.thumbnails[0] ? item.thumbnails[0].medium.url : null
}

const getItemIcon = (item) => {
  return isFolder(item) ? 'folder' : getItemThumbnailUrl(item)
}

const getItemSubList = (item) => {
  return item.value
}

const getItemName = (item) => {
  return item.name || ''
}

const getMimeType = (item) => {
  return item.file ? item.file.mimeType : null
}

const getItemId = (item) => {
  if (item.remoteItem) {
    return item.remoteItem.id
  }
  return item.id
}

const getItemRequestPath = (item) => {
  let query = `?driveId=${item.parentReference.driveId}`
  if (item.remoteItem) {
    query = `?driveId=${item.remoteItem.parentReference.driveId}`
  }
  return getItemId(item) + query
}

const getItemModifiedDate = (item) => {
  return item.lastModifiedDateTime
}

const getNextPagePath = ({ res, query: currentQuery, directory }) => {
  const nextLink = res['@odata.nextLink']
  if (!nextLink) {
    return null
  }

  const skipToken = new URL(nextLink).searchParams.get('$skiptoken')

  const query = { ...currentQuery, cursor: skipToken }
  return `${directory ?? ''}?${new URLSearchParams(query).toString()}`
}

module.exports = (res, username, query, directory) => {
  const data = { username, items: [] }
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
