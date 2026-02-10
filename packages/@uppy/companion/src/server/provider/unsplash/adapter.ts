import querystring from 'node:querystring'

type UnsplashPhoto = {
  id: string
  created_at?: string
  description?: string | null
  alt_description?: string | null
  urls: { thumb: string }
  user: { name: string; links: { html: string } }
}

type UnsplashSearchResponse = {
  total_pages: number
  results?: UnsplashPhoto[]
}

type UnsplashQuery = Record<string, string | undefined> & {
  cursor?: string
  q?: string
}

type UnsplashAdaptedItem = {
  isFolder: boolean
  icon: string
  name: string | undefined
  mimeType: string
  id: string
  thumbnail: string
  requestPath: string
  modifiedDate: string | undefined
  author: { name: string; url: string }
  size: null
}

const isFolder = (_item: UnsplashPhoto): boolean => {
  return false
}

const getItemIcon = (item: UnsplashPhoto): string => {
  return item.urls.thumb
}

const getItemSubList = (item: UnsplashSearchResponse): UnsplashPhoto[] => {
  return item.results
}

const getItemName = (item: UnsplashPhoto): string | undefined => {
  const description = item.description || item.alt_description
  if (description) {
    return `${description.replace(/^([\S\s]{27})[\S\s]{3,}/, '$1...')}.jpg`
  }
  return undefined
}

const getMimeType = (_item: UnsplashPhoto): string => {
  return 'image/jpeg'
}

const getItemId = (item: UnsplashPhoto): string => {
  return `${item.id}`
}

const getItemRequestPath = (item: UnsplashPhoto): string => {
  return `${item.id}`
}

const getItemModifiedDate = (item: UnsplashPhoto): string | undefined => {
  return item.created_at
}

const getItemThumbnailUrl = (item: UnsplashPhoto): string => {
  return item.urls.thumb
}

const getNextPageQuery = (currentQuery: UnsplashQuery): string => {
  const newCursor = Number.parseInt(currentQuery.cursor ?? '1', 10) + 1
  const query = {
    ...currentQuery,
    cursor: String(newCursor),
  }

  delete query.q
  return querystring.stringify(query)
}

const getAuthor = (
  item: UnsplashPhoto,
): {
  name: string
  url: string
} => {
  return { name: item.user.name, url: item.user.links.html }
}

const adaptData = (
  body: UnsplashSearchResponse,
  currentQuery: UnsplashQuery,
): {
  searchedFor: string | undefined
  username: null
  items: UnsplashAdaptedItem[]
  nextPageQuery: string | null
} => {
  const { total_pages: pagesCount } = body
  const { cursor, q } = currentQuery
  const currentPage = Number(cursor || 1)
  const hasNextPage = currentPage < pagesCount
  const subList = getItemSubList(body) || []

  return {
    searchedFor: q,
    username: null,
    items: subList.map((item): UnsplashAdaptedItem => ({
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
    nextPageQuery: hasNextPage ? getNextPageQuery(currentQuery) : null,
  }
}

export default adaptData
