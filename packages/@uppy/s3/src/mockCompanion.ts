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
import {
  decodeStorageGrant,
  normalizeStorageGrantPrefix,
  type StorageGrantClaims,
} from '@transloadit/utils'
import type { CompanionErrorCode } from '@uppy/core'
import { splitKey } from './keys.js'

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

/** Base64url of the UTF-8 bytes of `value`, as JWTs encode their parts. */
const base64url = (value: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

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

const json = (body: unknown, status = 200): MockS3Response => ({
  status,
  body,
})
/**
 * Companion reports its own user-facing failures by `code`, never as English
 * sentences; `@uppy/core` maps each code to its locale string.
 */
const userError = (code: CompanionErrorCode): MockS3Response =>
  json({ code }, 400)

/** The endpoints both providers serve: Transloadit Storage is the same HTTP surface under its own name. */
const ROUTE =
  /\/(s3|transloadit-storage)\/(simple-auth|list|mutate\/[a-z-]+|logout)(\/|$)/

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
  const configuredPrefix = normalizeStorageGrantPrefix(options.prefix ?? '')
  let bucket = configuredBucket
  let session: StorageGrantClaims | null = null
  const calls: MockS3Call[] = []
  const nowSeconds = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000))
  /** Root of the session: the grant's prefix, or the one the mock is configured with. */
  const sessionPrefix = () =>
    session ? normalizeStorageGrantPrefix(session.prefix) : configuredPrefix

  const toItem = (prefix: string, entry: MockS3Entry) => {
    const id = encodeURIComponent(
      `${prefix}${entry.name}${entry.isFolder ? '/' : ''}`,
    )
    return {
      isFolder: entry.isFolder,
      icon: entry.isFolder ? 'folder' : 'file',
      id,
      name: entry.name,
      requestPath: id,
      ...(entry.isFolder
        ? {}
        : {
            mimeType: entry.mimeType ?? null,
            size: entry.size ?? null,
            thumbnail: null,
          }),
    }
  }
  /** The response of a mutation: the (new) id of the entry at `key`. */
  const entryResponse = (key: string) => {
    const id = encodeURIComponent(key)
    return json({ id, requestPath: id })
  }
  const entriesOf = (prefix: string) => folders.get(prefix) ?? []
  /** Matches the entry at `key`: a file and a folder may share a name. */
  const isEntry = (key: string) => {
    const { name, isFolder } = splitKey(key)
    return (entry: MockS3Entry) =>
      entry.name === name && entry.isFolder === isFolder
  }
  const find = (key: string) =>
    entriesOf(splitKey(key).parent).find(isEntry(key))
  const add = (key: string, entry: MockS3Entry) => {
    const { parent } = splitKey(key)
    folders.set(parent, [...entriesOf(parent), entry])
  }
  /** Removes the entry at `key` (only the file, or only the folder, of that name) and a folder's subtree. */
  const remove = (key: string) => {
    const { parent, isFolder } = splitKey(key)
    const matches = isEntry(key)
    folders.set(
      parent,
      entriesOf(parent).filter((entry) => !matches(entry)),
    )
    if (isFolder) {
      for (const folder of [...folders.keys()]) {
        if (folder.startsWith(key)) folders.delete(folder)
      }
    }
  }
  const str = (body: unknown, key: string): string | null => {
    const value = (body as Record<string, unknown> | null)?.[key]
    return typeof value === 'string' ? value : null
  }

  const respond = (
    { method, body, token: sentToken }: MockS3Request,
    url: URL,
    operation: string,
    nativeMoves: boolean,
  ): MockS3Response => {
    if (method === 'OPTIONS') return { status: 204, body: null }

    if (method === 'POST' && operation === 'simple-auth') {
      // The client sends `{}` or `{ grant }`; the bucket is never its call.
      const form = (body as { form?: { grant?: string } } | null)?.form
      if (typeof form?.grant === 'string') {
        const claims = decodeStorageGrant(form.grant)
        if (!claims) return userError('S3_INVALID_GRANT')
        if (claims.exp <= nowSeconds()) return { status: 401, body: null }
        session = claims
        bucket = claims.bucket
      } else {
        session = null
        bucket = configuredBucket
      }
      return json({ uppyAuthToken: token })
    }
    if (method === 'GET' && operation === 'logout') {
      session = null
      return json({ ok: true, revoked: true })
    }
    if (sentToken !== token || (session && session.exp <= nowSeconds())) {
      return { status: 401, body: null }
    }
    if (session && !session.scopes.includes('read')) {
      return userError('S3_INVALID_GRANT')
    }
    if (
      operation.startsWith('mutate/') &&
      session &&
      !session.scopes.includes('write')
    ) {
      return userError('S3_READ_ONLY_SESSION')
    }

    if (method === 'GET' && operation === 'list') {
      const root = sessionPrefix()
      const prefix =
        decodeURIComponent(url.pathname.replace(/^.*\/list\/?/, '')) || root
      if (!prefix.startsWith(root))
        return userError('S3_OUTSIDE_ALLOWED_FOLDER')
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
            (session?.scopes.includes('write') ?? true),
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
        return userError('S3_INVALID_NAME')
      }
      const parentId = str(body, 'parentId')
      const prefix = parentId ? decodeURIComponent(parentId) : sessionPrefix()
      const key = `${prefix}${name}/`
      if (find(key)) return userError('S3_ALREADY_EXISTS')
      add(key, { name, isFolder: true })
      folders.set(key, [])
      return entryResponse(key)
    }
    if (method === 'POST' && operation === 'mutate/delete') {
      const id = str(body, 'id')
      if (!id) return userError('S3_REQUEST_FAILED')
      const key = decodeURIComponent(id)
      if (key.endsWith('/') && entriesOf(key).length > 0) {
        return userError('S3_FOLDER_NOT_EMPTY')
      }
      // Deleting a folder marker that is not there is a no-op success.
      remove(key)
      return { status: 204, body: null }
    }
    if (method === 'POST' && operation === 'mutate/move') {
      const id = str(body, 'id')
      const destination = str(body, 'destination')
      if (!id || !destination) return userError('S3_REQUEST_FAILED')
      const key = decodeURIComponent(id)
      if (key.endsWith('/')) {
        // The generic provider moves one file at a time: a folder is a key
        // prefix, and walking it is the client's job (`moveFolder` in
        // `@uppy/s3`). Transloadit Storage moves the whole subtree natively.
        if (!nativeMoves) return userError('S3_FOLDER_MOVE_NOT_SUPPORTED')
        if (!destination.endsWith('/'))
          return userError('S3_DESTINATION_MUST_BE_FILE')
        if (destination !== key) {
          if (!find(key)) return userError('S3_NOT_FOUND')
          if (find(destination)) return userError('S3_ALREADY_EXISTS')
          if (destination.startsWith(key)) return userError('S3_REQUEST_FAILED')
          for (const folder of [...folders.keys()]) {
            if (!folder.startsWith(key)) continue
            const entries = entriesOf(folder)
            folders.delete(folder)
            folders.set(`${destination}${folder.slice(key.length)}`, entries)
          }
          remove(key)
          add(destination, { name: splitKey(destination).name, isFolder: true })
        }
        return entryResponse(destination)
      }
      if (destination.endsWith('/')) {
        return userError('S3_DESTINATION_MUST_BE_FILE')
      }
      if (destination !== key) {
        const entry = find(key)
        if (!entry) return userError('S3_NOT_FOUND')
        const { parent, name } = splitKey(destination)
        const existing = entriesOf(parent).find(
          (candidate) => candidate.name === name,
        )
        // Idempotent: the same file already sitting at the destination means an
        // earlier attempt got through, so only the source is left to clean up.
        if (existing && (existing.isFolder || existing.size !== entry.size)) {
          return userError('S3_ALREADY_EXISTS')
        }
        remove(key)
        if (!existing) add(destination, { ...entry, name })
      }
      return entryResponse(destination)
    }
    return json({ message: 'unhandled mock route' }, 500)
  }

  const handle = (request: MockS3Request): MockS3Response | null => {
    const url = new URL(request.url, 'http://mock.invalid')
    const route = ROUTE.exec(url.pathname)
    if (!route) return null
    const call: MockS3Call = { ...request, path: url.pathname }
    calls.push(call)
    const response = respond(
      request,
      url,
      route[2] as string,
      // The only difference: Transloadit Storage moves folders natively.
      route[1] === 'transloadit-storage',
    )
    call.status = response.status
    return response
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
type MswLike<Handler> = {
  http: {
    all(
      path: string,
      resolver: (info: { request: Request }) => Promise<Response | undefined>,
    ): Handler
  }
}

/** msw request handlers for both providers' endpoints under `companionUrl`. */
export function toMswHandlers<Handler>(
  mock: MockS3Companion,
  companionUrl: string,
  msw: MswLike<Handler>,
): Handler[] {
  const base = companionUrl.replace(/\/$/, '')
  const serve = async ({ request }: { request: Request }) =>
    (await handleFetchRequest(mock, request)) ?? undefined
  return [
    msw.http.all(`${base}/s3/*`, serve),
    msw.http.all(`${base}/transloadit-storage/*`, serve),
  ]
}
