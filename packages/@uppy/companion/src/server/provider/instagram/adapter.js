exports.getUsername = (data) => {
  return data.data[0].user.username
}

exports.isFolder = (item) => {
  return false
}

exports.getItemIcon = (item) => {
  if (!item.images) {
    return 'video'
  }
  return item.images.low_resolution.url
}

exports.getItemSubList = (item) => {
  const subItems = []
  item.data.forEach((subItem) => {
    if (subItem.carousel_media) {
      subItem.carousel_media.forEach((i, index) => {
        const { id, created_time } = subItem
        const newSubItem = Object.assign({}, i, { id, created_time })
        newSubItem.carousel_id = index
        subItems.push(newSubItem)
      })
    } else {
      subItems.push(subItem)
    }
  })
  return subItems
}

exports.getItemName = (item) => {
  if (item && item['created_time']) {
    const ext = item.type === 'video' ? 'mp4' : 'jpeg'
    let date = new Date(item['created_time'] * 1000)
    const name = date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
    // adding both date and carousel_id, so the name is unique
    return `Instagram ${name}${item.carousel_id ? ' ' + item.carousel_id : ''}.${ext}`
  }
  return ''
}

exports.getMimeType = (item) => {
  return item.type === 'video' ? 'video/mp4' : 'image/jpeg'
}

exports.getItemId = (item) => {
  return `${item.id}${item.carousel_id || ''}`
}

exports.getItemRequestPath = (item) => {
  const suffix = isNaN(item.carousel_id) ? '' : `?carousel_id=${item.carousel_id}`
  return `${item.id}${suffix}`
}

exports.getItemModifiedDate = (item) => {
  return item.created_time
}

exports.getItemThumbnailUrl = (item) => {
  return item.images.thumbnail.url
}

exports.getNextPagePath = (data) => {
  const { files } = this.getPluginState()
  return `recent?max_id=${this.getItemId(files[files.length - 1])}`
}
