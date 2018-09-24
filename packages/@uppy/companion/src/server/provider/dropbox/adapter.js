exports.getUsername = (data) => {
  return data.user_email
}

exports.isFolder = (item) => {
  return item['.tag'] === 'folder'
}

exports.getItemIcon = (item) => {
  return item['.tag']
}

exports.getItemSubList = (item) => {
  return item.entries
}

exports.getItemName = (item) => {
  return item.name || ''
}

exports.getMimeType = (item) => {
  // mime types aren't supported.
  return null
}

exports.getItemId = (item) => {
  return item.id
}

exports.getItemRequestPath = (item) => {
  return encodeURIComponent(item.path_lower)
}

exports.getItemModifiedDate = (item) => {
  return item.server_modified
}

exports.getItemThumbnailUrl = (item) => {
  return `${this.opts.serverUrl}/${this.Dropbox.id}/thumbnail/${this.getItemRequestPath(item)}`
}
