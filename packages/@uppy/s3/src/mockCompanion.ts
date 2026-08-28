/**
 * An in-memory stand-in for Companion's S3 provider endpoints, for tests of
 * anything built on `@uppy/s3` (Uppy's own browser tests, integrators'
 * Playwright/Cypress suites). Framework-agnostic: `handle()` takes a plain
 * description of the request and returns `{ status, body }`, and
 * `handleFetchRequest()` / `toMswHandlers()` adapt that to the Fetch API / msw.
 *
 * Keys follow the S3 provider's addressing: folders end with `/`, ids in
 * responses are `encodeURIComponent(key)`.
 */

export type MockS3Entry = {
  name: string
  isFolder: boolean
  size?: number
  mimeType?: string
}

export type MockS3Request = {
  method: string
  url: string
  /** Parsed JSON body for POST requests. */
  body?: unknown
  /** Value of the `uppy-auth-token` header. */
  token?: string | null
}

export type MockS3Response = { status: number; body: unknown }

export type MockS3Call = MockS3Request & { path: string }

export type MockS3CompanionOptions = {
  /** Folder key (`''` for the root, `docs/` for a folder) → its entries. */
  folders?: Record<string, MockS3Entry[]>
  /** Token handed out by simple-auth; requests must send it back. */
  token?: string
  /** Bucket name reported as the "username" of the listing. */
  bucket?: string
}

export type MockS3Companion = {
  folders: Map<string, MockS3Entry[]>
  calls: MockS3Call[]
  token: string
  /** Serve one request; `null` when the URL is not an `/s3/*` endpoint. */
  handle(request: MockS3Request): MockS3Response | null
  lastCall(path: string): MockS3Call | undefined
}

const DEFAULT_FOLDERS: Record<string, MockS3Entry[]> = {
  '': [
    { name: 'docs', isFolder: true },
    { name: 'readme.md', isFolder: false, size: 9, mimeType: 'text/markdown' },
  ],
  'docs/': [
    { name: 'hello.txt', isFolder: false, size: 12, mimeType: 'text/plain' },
  ],
}

const splitKey = (key: string) => {
  const bare = key.endsWith('/') ? key.slice(0, -1) : key
  const slash = bare.lastIndexOf('/')
  return {
    prefix: slash === -1 ? '' : bare.slice(0, slash + 1),
    name: bare.slice(slash + 1),
  }
}

const json = (body: unknown, status = 200): MockS3Response => ({
  status,
  body,
})
const userError = (message: string): MockS3Response => json({ message }, 400)

export function createMockS3Companion(
  options: MockS3CompanionOptions = {},
): MockS3Companion {
  const folders = new Map<string, MockS3Entry[]>(
    Object.entries(options.folders ?? DEFAULT_FOLDERS).map(([k, v]) => [
      k,
      v.map((entry) => ({ ...entry })),
    ]),
  )
  const token = options.token ?? 'mock-auth-token'
  let bucket = options.bucket ?? 'my-bucket'
  const calls: MockS3Call[] = []

  const toItem = (prefix: string, entry: MockS3Entry) => {
    const key = `${prefix}${entry.name}${entry.isFolder ? '/' : ''}`
    return {
      isFolder: entry.isFolder,
      icon: entry.isFolder ? 'folder' : 'file',
      id: encodeURIComponent(key),
      name: entry.name,
      requestPath: encodeURIComponent(key),
      ...(entry.isFolder
        ? {}
        : {
            mimeType: entry.mimeType ?? null,
            size: entry.size ?? null,
            thumbnail: null,
          }),
    }
  }
  const entriesOf = (prefix: string) => folders.get(prefix) ?? []
  const has = (key: string) => {
    const { prefix, name } = splitKey(key)
    return entriesOf(prefix).some(
      (entry) => entry.name === name && entry.isFolder === key.endsWith('/'),
    )
  }
  const remove = (key: string) => {
    const { prefix, name } = splitKey(key)
    folders.set(
      prefix,
      entriesOf(prefix).filter((entry) => entry.name !== name),
    )
    if (key.endsWith('/')) {
      for (const folder of [...folders.keys()]) {
        if (folder.startsWith(key)) folders.delete(folder)
      }
    }
  }
  const str = (body: unknown, key: string): string | null => {
    const value = (body as Record<string, unknown> | null)?.[key]
    return typeof value === 'string' ? value : null
  }

  const handle = (request: MockS3Request): MockS3Response | null => {
    const url = new URL(request.url, 'http://mock.invalid')
    const path = url.pathname
    if (!/\/s3\/(simple-auth|list|mutate\/[a-z-]+|logout)(\/|$)/.test(path)) {
      return null
    }
    calls.push({ ...request, path })
    const { method, body } = request
    if (method === 'OPTIONS') return { status: 204, body: null }

    if (method === 'POST' && path.endsWith('/s3/simple-auth')) {
      const form = (body as { form?: { bucket?: string } } | null)?.form
      if (typeof form?.bucket === 'string' && form.bucket.length > 0) {
        bucket = form.bucket.replace(/^s3:\/\//, '').split('/')[0] ?? bucket
      }
      return json({ uppyAuthToken: token })
    }
    if (method === 'GET' && path.endsWith('/s3/logout')) {
      return json({ ok: true, revoked: true })
    }
    if (request.token !== token) return json({ message: 'unauthorized' }, 401)

    if (method === 'GET' && path.includes('/s3/list')) {
      const prefix = decodeURIComponent(path.replace(/^.*\/s3\/list\/?/, ''))
      return json({
        username: bucket,
        nextPagePath: null,
        items: entriesOf(prefix).map((entry) => toItem(prefix, entry)),
      })
    }
    if (method === 'POST' && path.endsWith('/s3/mutate/create-folder')) {
      const name =
        str(body, 'name')
          ?.trim()
          .replace(/^\/+|\/+$/g, '') ?? ''
      if (name.length === 0 || name.includes('/')) {
        return userError('Invalid folder name')
      }
      const parentId = str(body, 'parentId')
      const prefix = parentId ? decodeURIComponent(parentId) : ''
      const key = `${prefix}${name}/`
      if (has(key)) return userError(`A folder named "${name}" already exists`)
      folders.set(prefix, [...entriesOf(prefix), { name, isFolder: true }])
      folders.set(key, [])
      const id = encodeURIComponent(key)
      return json({ id, requestPath: id })
    }
    if (method === 'POST' && path.endsWith('/s3/mutate/delete')) {
      const id = str(body, 'id')
      if (!id) return userError('Missing id')
      const key = decodeURIComponent(id)
      if (key.endsWith('/') && entriesOf(key).length > 0) {
        return userError('The folder is not empty')
      }
      remove(key)
      return json({ ok: true })
    }
    if (method === 'POST' && path.endsWith('/s3/mutate/move')) {
      const id = str(body, 'id')
      const destination = str(body, 'destination')
      if (!id || !destination) return userError('Missing id or destination')
      const key = decodeURIComponent(id)
      const isFolder = key.endsWith('/')
      if (!isFolder && destination.endsWith('/')) {
        return userError('The destination of a file must be a file path')
      }
      const target =
        isFolder && !destination.endsWith('/') ? `${destination}/` : destination
      if (target !== key) {
        if (isFolder && target.startsWith(key)) {
          return userError('A folder cannot be moved into itself')
        }
        if (has(target)) return userError(`"${target}" already exists`)
        const from = splitKey(key)
        const to = splitKey(target)
        const entry = entriesOf(from.prefix).find(
          (candidate) => candidate.name === from.name,
        )
        if (!entry) return json({ message: 'Not found' }, 404)
        folders.set(
          from.prefix,
          entriesOf(from.prefix).filter((c) => c.name !== from.name),
        )
        folders.set(to.prefix, [
          ...entriesOf(to.prefix),
          { ...entry, name: to.name },
        ])
        if (isFolder) {
          for (const folder of [...folders.keys()]) {
            if (folder.startsWith(key)) {
              folders.set(
                `${target}${folder.slice(key.length)}`,
                folders.get(folder) ?? [],
              )
              folders.delete(folder)
            }
          }
        }
      }
      const newId = encodeURIComponent(target)
      return json({ id: newId, requestPath: newId })
    }
    return json({ message: 'unhandled mock route' }, 500)
  }

  return {
    folders,
    calls,
    token,
    handle,
    lastCall: (path) => calls.filter((call) => call.path === path).at(-1),
  }
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': '*',
}

/**
 * Serve a Fetch API `Request` from the mock; resolves to `null` when the
 * request is not for an `/s3/*` endpoint (so callers can pass it through).
 */
export async function handleFetchRequest(
  mock: MockS3Companion,
  request: Request,
): Promise<Response | null> {
  const body =
    request.method === 'POST'
      ? await request
          .clone()
          .json()
          .catch(() => undefined)
      : undefined
  const result = mock.handle({
    method: request.method,
    url: request.url,
    body,
    token: request.headers.get('uppy-auth-token'),
  })
  if (!result) return null
  if (result.body === null) {
    return new Response(null, { status: result.status, headers: corsHeaders })
  }
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  })
}

/** The subset of `msw` this needs, passed in so msw stays a dev dependency. */
type MswLike = {
  http: {
    all(
      path: string,
      resolver: (info: { request: Request }) => Promise<Response | undefined>,
    ): unknown
  }
}

/** msw request handlers for every `/s3/*` endpoint under `companionUrl`. */
export function toMswHandlers(
  mock: MockS3Companion,
  companionUrl: string,
  msw: MswLike,
): unknown[] {
  return [
    msw.http.all(
      `${companionUrl.replace(/\/$/, '')}/s3/*`,
      async ({ request }) =>
        (await handleFetchRequest(mock, request)) ?? undefined,
    ),
  ]
}
