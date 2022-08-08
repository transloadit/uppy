const mime = require('mime-types')
const querystring = require('node:querystring')

const isFolder = (item) => {
  return item['.tag'] === 'folder'
}

const getItemSize = (item) => {
  return item.size
}

const getItemIcon = (item) => {
  return item['.tag']
}

const getItemSubList = (item) => {
  return item.entries
}

const getItemName = (item) => {
  return item.name || ''
}

const getMimeType = (item) => {
  return mime.lookup(getItemName(item)) || null
}

const getItemId = (item) => {
  return item.id
}

const getItemRequestPath = (item) => {
  return encodeURIComponent(item.path_lower)
}

const getItemModifiedDate = (item) => {
  return item.server_modified
}

const getItemThumbnailUrl = (item) => {
  return `/dropbox/thumbnail/${getItemRequestPath(item)}`
}

const getNextPagePath = (data) => {
  if (!data.has_more) {
    return null
  }
  const query = { cursor: data.cursor }
  return `?${querystring.stringify(query)}`
}

module.exports = (res, email, buildURL) => {
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
