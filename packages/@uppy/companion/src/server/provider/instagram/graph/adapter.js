const querystring = require('node:querystring')

const MEDIA_TYPES = Object.freeze({
  video: 'VIDEO',
  carousel: 'CAROUSEL_ALBUM',
  image: 'IMAGE',
})

const isVideo = (item) => item.media_type === MEDIA_TYPES.video

const isFolder = (item) => { // eslint-disable-line no-unused-vars
  return false
}

const getItemIcon = (item) => {
  return isVideo(item) ? item.thumbnail_url : item.media_url
}

const getItemSubList = (item) => {
  const newItems = []
  item.data.forEach((subItem) => {
    if (subItem.media_type === MEDIA_TYPES.carousel) {
      subItem.children.data.forEach((i) => newItems.push(i))
    } else {
      newItems.push(subItem)
    }
  })
  return newItems
}

const getItemName = (item, index) => {
  const ext = isVideo(item) ? 'mp4' : 'jpeg'
  // adding index, so the name is unique
  return `Instagram ${item.timestamp}${index}.${ext}`
}

const getMimeType = (item) => {
  return isVideo(item) ? 'video/mp4' : 'image/jpeg'
}

const getItemId = (item) => item.id

const getItemRequestPath = (item) => item.id

const getItemModifiedDate = (item) => item.timestamp

const getItemThumbnailUrl = (item) => getItemIcon(item)

const getNextPagePath = (data, currentQuery, currentPath) => {
  if (!data.paging || !data.paging.cursors) {
    return null
  }

  const query = { ...currentQuery, cursor: data.paging.cursors.after }
  return `${currentPath || ''}?${querystring.stringify(query)}`
}

module.exports = (res, username, directory, currentQuery) => {
  const data = { username, items: [] }
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
