const querystring = require('node:querystring')

const isFolder = (item) => { // eslint-disable-line no-unused-vars
  return false
}

const getItemIcon = (item) => {
  return item.urls.thumb
}

const getItemSubList = (item) => {
  return item.results
}

const getItemName = (item) => {
  const description = item.description || item.alt_description
  if (description) {
    return `${description.replace(/^([\S\s]{27})[\S\s]{3,}/, '$1...')}.jpg`
  }
  return undefined
}

const getMimeType = (item) => { // eslint-disable-line no-unused-vars
  return 'image/jpeg'
}

const getItemId = (item) => {
  return `${item.id}`
}

const getItemRequestPath = (item) => {
  return `${item.id}`
}

const getItemModifiedDate = (item) => {
  return item.created_at
}

const getItemThumbnailUrl = (item) => {
  return item.urls.thumb
}

const getNextPageQuery = (currentQuery) => {
  const newCursor = Number.parseInt(currentQuery.cursor || 1, 10) + 1
  const query = {
    ...currentQuery,
    cursor: newCursor,
  }

  delete query.q
  return querystring.stringify(query)
}

const getAuthor = (item) => {
  return { name: item.user.name, url: item.user.links.html }
}

module.exports = (body, currentQuery) => {
  const { total_pages: pagesCount } = body
  const { cursor, q } = currentQuery
  const currentPage = Number(cursor || 1)
  const hasNextPage = currentPage < pagesCount
  const subList = getItemSubList(body) || []

  return {
    searchedFor: q,
    username: null,
    items: subList.map((item) => ({
      isFolder: isFolder(item),
      icon: getItemIcon(item),
      name: getItemName(item),
      mimeType: getMimeType(item),
      id: getItemId(item),
      thumbnail: getItemThumbnailUrl(item),
      requestPath: getItemRequestPath(item),
      modifiedDate: getItemModifiedDate(item),
      author: getAuthor(item),
      size: null,
    })),
    nextPageQuery: hasNextPage
      ? getNextPageQuery(currentQuery)
      : null,
  }
}
