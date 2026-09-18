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

export type MockS3Call = MockS3Request & {
  path: string
  /** HTTP status the mock answered with (set once the request was handled). */
  status?: number
}

/** Claims of a mock grant (see `mockGrant`). */
export type MockS3GrantClaims = {
  bucket: string
  prefix?: string
  scopes?: ('read' | 'write')[]
  /** Unix seconds. Defaults to 15 minutes from now. */
  exp?: number
}

const base64url = (value: string): string =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/**
 * Builds an *unsigned* grant in JWT shape for the mock (a real Companion would
 * reject it): `getGrant` implementations in tests can return this.
 */
export function mockGrant(claims: MockS3GrantClaims): string {
  const payload = {
    v: 1,
    bucket: claims.bucket,
    prefix: claims.prefix ?? '',
    scopes: claims.scopes ?? ['read', 'write'],
    exp: claims.exp ?? Math.floor(Date.now() / 1000) + 15 * 60,
  }
  return `${base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify(payload),
  )}.mock-signature`
}

const decodeMockGrant = (grant: string): MockS3GrantClaims | null => {
  try {
    const payload = grant.split('.')[1] ?? ''
    const claims = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as Partial<MockS3GrantClaims>
    if (typeof claims.bucket !== 'string') return null
    return {
      bucket: claims.bucket,
      prefix: typeof claims.prefix === 'string' ? claims.prefix : '',
      scopes: Array.isArray(claims.scopes) ? claims.scopes : ['read', 'write'],
      ...(typeof claims.exp === 'number' && { exp: claims.exp }),
    }
  } catch {
    return null
  }
}

export type MockS3CompanionOptions = {
  /** Folder key (`''` for the root, `docs/` for a folder) → its entries. */
  folders?: Record<string, MockS3Entry[]>
  /** Token handed out by simple-auth; requests must send it back. */
  token?: string
  /**
   * Bucket the mock serves, reported as the "username" of the listing. Like a
   * real Companion, it comes from this configuration or from a grant — never
   * from the client.
   */
  bucket?: string
  /**
   * Key prefix a session without a grant is confined to (`''` by default): the
   * listing root, where `createFolder(null, …)` puts new folders, and the only
   * subtree that may be listed. A grant carries its own prefix.
   */
  prefix?: string
  /** Whether Companion lets the session change files. Defaults to true. */
  canWrite?: boolean
  /** Inject the server clock to test expiration without depending on browser/render speed. */
  nowSeconds?: () => number
  /** Maximum entries per listing page; defaults to an unpaginated listing. */
  pageSize?: number
}

export type MockS3Companion = {
  folders: Map<string, MockS3Entry[]>
  calls: MockS3Call[]
  token: string
  /** Scope/expiry of the current session when it was opened with a grant. */
  readonly session: MockS3GrantClaims | null
  /**
   * Serve one request; `null` when the URL is neither an `/s3/*` nor a
   * `/transloadit-storage/*` endpoint.
   */
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
/**
 * Companion reports its own user-facing failures as `i18nKey` (`@uppy/core`'s
 * `s3*` strings), never as English sentences.
 */
/**
 * The locale keys Companion's S3 provider answers with.
 * TODO: import `S3UserMessageKey` from `@uppy/companion` instead of mirroring
 * it, once the monorepo's tsconfig lets client packages use its types.
 */
type S3CompanionMessageKey =
  | 's3AlreadyExists'
  | 's3Conflict'
  | 's3DestinationMustBeFile'
  | 's3FileTooLargeToMove'
  | 's3FolderIntoItself'
  | 's3FolderMoveNotSupported'
  | 's3FolderNotEmpty'
  | 's3InvalidGrant'
  | 's3InvalidName'
  | 's3NotConfigured'
  | 's3NotFound'
  | 's3OutsideAllowedFolder'
  | 's3ReadOnlySession'
  | 's3RequestFailed'
  | 's3SelectedInOtherSession'

const userError = (i18nKey: S3CompanionMessageKey): MockS3Response =>
  json({ i18nKey }, 400)

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
  const configuredBucket = options.bucket ?? 'my-bucket'
  let bucket = configuredBucket
  let session: MockS3GrantClaims | null = null
  const calls: MockS3Call[] = []
  const nowSeconds = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000))
  const expired = () =>
    session?.exp !== undefined && session.exp <= nowSeconds()
  const asPrefix = (value: string) => {
    const bare = value.replace(/^\/+|\/+$/g, '')
    return bare ? `${bare}/` : ''
  }
  const configuredPrefix = asPrefix(options.prefix ?? '')
  /** Root of the session: the grant's prefix, or the one the mock is configured with. */
  const sessionPrefix = () =>
    session ? asPrefix(session.prefix ?? '') : configuredPrefix

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
      entriesOf(prefix).filter(
        (entry) => entry.name !== name || entry.isFolder !== key.endsWith('/'),
      ),
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

  // Holder object: TypeScript cannot see that handleInner assigns the current call.
  const inFlight: { call: MockS3Call | undefined } = { call: undefined }
  const currentCall = () => inFlight.call
  const handleInner = (request: MockS3Request): MockS3Response | null => {
    const url = new URL(request.url, 'http://mock.invalid')
    const path = url.pathname
    // Transloadit Storage is the same HTTP surface under its own provider name;
    // the only difference is that it moves folders natively (see mutate/move).
    const route =
      /\/(s3|transloadit-storage)\/(simple-auth|list|mutate\/[a-z-]+|logout)(\/|$)/.exec(
        path,
      )
    if (!route) {
      return null
    }
    const operation = route[2] as string
    const nativeMoves = route[1] === 'transloadit-storage'
    inFlight.call = { ...request, path }
    calls.push(inFlight.call)
    const { method, body } = request
    if (method === 'OPTIONS') return { status: 204, body: null }

    if (method === 'POST' && operation === 'simple-auth') {
      // The client sends `{}` or `{ grant }`; the bucket is never its call.
      const form = (body as { form?: { grant?: string } } | null)?.form
      if (typeof form?.grant === 'string') {
        const claims = decodeMockGrant(form.grant)
        if (!claims) return userError('s3InvalidGrant')
        if (claims.exp !== undefined && claims.exp <= nowSeconds()) {
          return { status: 401, body: null }
        }
        session = claims
        bucket = claims.bucket
      } else {
        session = null
        bucket = configuredBucket
      }
      return json({ uppyAuthToken: token })
    }
    if (request.token !== token || expired()) {
      return { status: 401, body: null }
    }
    if (session && !session.scopes?.includes('read')) {
      return userError('s3InvalidGrant')
    }
    if (
      operation.startsWith('mutate/') &&
      session &&
      !session.scopes?.includes('write')
    ) {
      return userError('s3ReadOnlySession')
    }

    if (method === 'GET' && operation === 'list') {
      const root = sessionPrefix()
      const prefix =
        decodeURIComponent(path.replace(/^.*\/list\/?/, '')) || root
      if (!prefix.startsWith(root)) return userError('s3OutsideAllowedFolder')
      const entries = entriesOf(prefix)
      const offset = Number(url.searchParams.get('offset') ?? 0)
      const pageSize = Math.max(1, options.pageSize ?? entries.length)
      const nextOffset = offset + pageSize
      return json({
        username: bucket,
        // What the session may do, and where it is rooted: the client hides
        // the management actions and resolves typed paths with these.
        session: {
          bucket,
          prefix: root,
          canWrite:
            (options.canWrite ?? true) &&
            (session?.scopes?.includes('write') ?? true),
          supportsMoveFolder: nativeMoves,
        },
        nextPagePath:
          nextOffset < entries.length
            ? `${encodeURIComponent(prefix)}?offset=${nextOffset}`
            : null,
        items: entries
          .slice(offset, nextOffset)
          .map((entry) => toItem(prefix, entry)),
      })
    }
    if (method === 'POST' && operation === 'mutate/create-folder') {
      const name =
        str(body, 'name')
          ?.trim()
          .replace(/^\/+|\/+$/g, '') ?? ''
      if (name.length === 0 || name.includes('/')) {
        return userError('s3InvalidName')
      }
      const parentId = str(body, 'parentId')
      const prefix = parentId ? decodeURIComponent(parentId) : sessionPrefix()
      const key = `${prefix}${name}/`
      if (has(key)) return userError('s3AlreadyExists')
      folders.set(prefix, [...entriesOf(prefix), { name, isFolder: true }])
      folders.set(key, [])
      const id = encodeURIComponent(key)
      return json({ id, requestPath: id })
    }
    if (method === 'POST' && operation === 'mutate/delete') {
      const id = str(body, 'id')
      if (!id) return userError('s3RequestFailed')
      const key = decodeURIComponent(id)
      if (key.endsWith('/') && entriesOf(key).length > 0) {
        return userError('s3FolderNotEmpty')
      }
      // Deleting a folder marker that is not there is a no-op success.
      remove(key)
      return { status: 204, body: null }
    }
    if (method === 'POST' && operation === 'mutate/move') {
      const id = str(body, 'id')
      const destination = str(body, 'destination')
      if (!id || !destination) return userError('s3RequestFailed')
      const key = decodeURIComponent(id)
      if (key.endsWith('/')) {
        // The generic provider moves one file at a time: a folder is a key
        // prefix, and walking it is the client's job (`moveFolder` in
        // `@uppy/s3`). Transloadit Storage moves the whole subtree natively.
        if (!nativeMoves) return userError('s3FolderMoveNotSupported')
        if (!destination.endsWith('/'))
          return userError('s3DestinationMustBeFile')
        if (destination !== key) {
          if (!has(key)) return userError('s3NotFound')
          if (has(destination)) return userError('s3AlreadyExists')
          if (destination.startsWith(key)) return userError('s3RequestFailed')
          for (const folder of [...folders.keys()]) {
            if (!folder.startsWith(key)) continue
            const entries = entriesOf(folder)
            folders.delete(folder)
            folders.set(`${destination}${folder.slice(key.length)}`, entries)
          }
          const from = splitKey(key)
          const to = splitKey(destination)
          folders.set(
            from.prefix,
            entriesOf(from.prefix).filter(
              (candidate) =>
                candidate.name !== from.name || !candidate.isFolder,
            ),
          )
          folders.set(to.prefix, [
            ...entriesOf(to.prefix),
            { name: to.name, isFolder: true },
          ])
        }
        const movedId = encodeURIComponent(destination)
        return json({ id: movedId, requestPath: movedId })
      }
      if (destination.endsWith('/')) {
        return userError('s3DestinationMustBeFile')
      }
      if (destination !== key) {
        const from = splitKey(key)
        const to = splitKey(destination)
        const entry = entriesOf(from.prefix).find(
          (candidate) => candidate.name === from.name && !candidate.isFolder,
        )
        if (!entry) return userError('s3NotFound')
        const existing = entriesOf(to.prefix).find(
          (candidate) => candidate.name === to.name,
        )
        // Idempotent: the same file already sitting at the destination means an
        // earlier attempt got through, so only the source is left to clean up.
        if (existing && (existing.isFolder || existing.size !== entry.size)) {
          return userError('s3AlreadyExists')
        }
        folders.set(
          from.prefix,
          entriesOf(from.prefix).filter((c) => c.name !== from.name),
        )
        if (!existing) {
          folders.set(to.prefix, [
            ...entriesOf(to.prefix),
            { ...entry, name: to.name },
          ])
        }
      }
      const newId = encodeURIComponent(destination)
      return json({ id: newId, requestPath: newId })
    }
    return json({ message: 'unhandled mock route' }, 500)
  }
  const handle = (request: MockS3Request): MockS3Response | null => {
    inFlight.call = undefined
    const result = handleInner(request)
    const call = currentCall()
    if (result && call) call.status = result.status
    return result
  }

  return {
    folders,
    calls,
    token,
    get session() {
      return session
    },
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
 * request is for neither provider's endpoints (so callers can pass it through).
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

/** msw request handlers for both providers' endpoints under `companionUrl`. */
export function toMswHandlers(
  mock: MockS3Companion,
  companionUrl: string,
  msw: MswLike,
): unknown[] {
  const base = companionUrl.replace(/\/$/, '')
  const serve = async ({ request }: { request: Request }) =>
    (await handleFetchRequest(mock, request)) ?? undefined
  // The Transloadit Storage provider speaks the same protocol under its own
  // name (with native folder moves), so the mock serves both.
  return [
    msw.http.all(`${base}/s3/*`, serve),
    msw.http.all(`${base}/transloadit-storage/*`, serve),
  ]
}
