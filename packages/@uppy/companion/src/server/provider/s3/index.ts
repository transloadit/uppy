import type { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  paginateListObjectsV2,
  type S3Client,
} from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'
import { lookup as mimeLookup } from 'mime-types'
import pMap from 'p-map'
import type { CompanionRuntimeOptions } from '../../../types/companion-options.js'
import { isRecord } from '../../helpers/type-guards.js'
import logger from '../../logger.js'
import getS3Client from '../../s3-client.js'
import {
  ProviderApiError,
  ProviderAuthError,
  ProviderUserError,
} from '../error.js'
import Provider, {
  type CompanionLike,
  type ProviderListItem,
  type ProviderListResponse,
  type Query,
} from '../Provider.js'

export type S3GrantScope = 'read' | 'write'

/**
 * Session for the S3 provider, created via "simple auth" (non-OAuth) in one
 * of two ways:
 * - a **grant**: a short-lived JWT minted by the integrator's server after it
 *   authenticated the user, carrying the bucket, the prefix the user may see
 *   and the scopes they hold (see `S3Grant`). This is the multi-tenant path.
 * - a **bucket** (`my-bucket/optional/prefix`) typed or configured on the
 *   client. Only accepted when Companion is not configured for grants, or
 *   `s3.allowBucketAuth` is set (development).
 */
type S3UserSession = {
  bucket: string
  prefix: string
  /** Missing on bucket sessions and on tokens from before grants existed. */
  scopes?: S3GrantScope[]
  /** Unix seconds; only grant sessions expire. */
  exp?: number
}

/** Claims of a storage grant (`s3.grantSecret`, HS256). */
export type S3Grant = {
  v: 1
  bucket: string
  prefix: string
  scopes: S3GrantScope[]
  sub?: string
  iat?: number
  exp: number
}

const GRANT_SCOPES: S3GrantScope[] = ['read', 'write']

/** Validate the decoded JWT payload against the grant contract. */
const parseGrantClaims = (payload: unknown): S3Grant => {
  if (
    !isRecord(payload) ||
    payload['v'] !== 1 ||
    typeof payload['bucket'] !== 'string' ||
    payload['bucket'].length === 0 ||
    typeof payload['prefix'] !== 'string' ||
    !Array.isArray(payload['scopes']) ||
    !payload['scopes'].every(
      (scope): scope is S3GrantScope =>
        typeof scope === 'string' && (GRANT_SCOPES as string[]).includes(scope),
    ) ||
    typeof payload['exp'] !== 'number'
  ) {
    throw new ProviderUserError({ message: 'Invalid storage grant' })
  }
  const prefix = payload['prefix'].replace(/^\/+/, '')
  return {
    v: 1,
    bucket: payload['bucket'],
    prefix: ensureTrailingSlash(prefix),
    scopes: [...new Set(payload['scopes'])],
    ...(typeof payload['sub'] === 'string' && { sub: payload['sub'] }),
    ...(typeof payload['iat'] === 'number' && { iat: payload['iat'] }),
    exp: payload['exp'],
  }
}

type CompanionS3Options = Pick<CompanionRuntimeOptions, 's3'>

const ensureTrailingSlash = (s: string): string =>
  s.length === 0 || s.endsWith('/') ? s : `${s}/`

/** Upper bound on the entries (objects + folders) a folder move may touch. */
const MAX_FOLDER_MOVE_ENTRIES = 1000
/** How many S3 calls a folder move runs at once. */
const MOVE_CONCURRENCY = 8

const isNotFound = (err: unknown): boolean => {
  if (!isRecord(err)) return false
  const status = (err['$metadata'] as { httpStatusCode?: number } | undefined)
    ?.httpStatusCode
  return (
    err['name'] === 'NotFound' || err['name'] === 'NoSuchKey' || status === 404
  )
}

/**
 * Parses user input like `my-bucket`, `my-bucket/some/prefix` or
 * `s3://my-bucket/some/prefix` into { bucket, prefix }.
 */
const parseBucketInput = (
  raw: string,
): { bucket: string; prefix: string } | null => {
  const cleaned = raw.trim().replace(/^s3:\/\//, '')
  if (cleaned.length === 0) return null
  const [bucket, ...rest] = cleaned.split('/')
  if (!bucket) return null
  const prefix = ensureTrailingSlash(rest.join('/').replace(/^\/+/, ''))
  return { bucket, prefix }
}

const iconForKey = (key: string): string => {
  const mime = mimeLookup(key)
  if (typeof mime === 'string' && mime.startsWith('video/')) return 'video'
  return 'file'
}

/**
 * Adapter for browsing S3-compatible object storage (AWS S3, Cloudflare R2,
 * MinIO, ...). Uses the same `s3` Companion options (key/secret/region/endpoint)
 * that the S3 upload endpoints already use.
 */
export default class S3Provider extends Provider<S3UserSession> {
  static override get hasSimpleAuth() {
    return true
  }

  static override get supportsMutations() {
    return true
  }

  isAuthenticated({
    providerUserSession,
  }: {
    providerUserSession: S3UserSession | undefined
  }): boolean {
    return (
      providerUserSession != null &&
      typeof providerUserSession.bucket === 'string' &&
      providerUserSession.bucket.length > 0
    )
  }

  /**
   * S3 browsing is off unless the integrator explicitly allowlists buckets.
   * Otherwise anyone could use Companion's credentials to list arbitrary
   * buckets (including a shared upload bucket).
   */
  assertBucketAllowed(companionOptions: CompanionS3Options, bucket: string) {
    const allowed = companionOptions.s3?.browsableBuckets ?? []
    if (allowed.includes('*') || allowed.includes(bucket)) return
    throw new ProviderUserError({
      message:
        allowed.length === 0
          ? 'S3 browsing is not enabled on this Companion (set `s3.browsableBuckets` / COMPANION_AWS_BROWSABLE_BUCKETS)'
          : `Bucket "${bucket}" is not allowed for browsing`,
    })
  }

  /**
   * Mutations are gated separately from browsing so a read-only browser is
   * the default even when credentials would allow writes.
   */
  assertBucketMutable(companionOptions: CompanionS3Options, bucket: string) {
    const allowed = companionOptions.s3?.mutableBuckets ?? []
    if (allowed.includes('*') || allowed.includes(bucket)) return
    throw new ProviderUserError({
      message:
        allowed.length === 0
          ? 'Changing files in S3 is not enabled on this Companion (set `s3.mutableBuckets` / COMPANION_AWS_MUTABLE_BUCKETS)'
          : `Bucket "${bucket}" is read-only`,
    })
  }

  getClient(companionOptions: CompanionS3Options): S3Client {
    const client = getS3Client(companionOptions)
    if (client == null) {
      throw new ProviderUserError({
        message:
          'Companion is not configured for S3 (missing `s3` options such as region)',
      })
    }
    return client
  }

  /**
   * Every operation starts here: a valid session, an allowlisted bucket
   * (writable when `mutate`), and every key inside the scoped prefix.
   */
  #session(
    companion: CompanionLike,
    providerUserSession: S3UserSession,
    { mutate = false, keys = [] as string[] } = {},
  ): { bucket: string; prefix: string; client: S3Client } {
    if (!this.isAuthenticated({ providerUserSession })) {
      throw new ProviderAuthError()
    }
    const { bucket, prefix, scopes, exp } = providerUserSession
    // An expired grant is an auth error: the client fetches a fresh grant.
    if (exp !== undefined && exp <= Math.floor(Date.now() / 1000)) {
      throw new ProviderAuthError()
    }
    // Scope checks are user errors, so the Dashboard explains instead of
    // bouncing to the connect screen (a fresh grant would not help).
    if (scopes && !scopes.includes('read')) {
      throw new ProviderUserError({
        message: 'Your session does not allow browsing this storage',
      })
    }
    if (mutate && scopes && !scopes.includes('write')) {
      throw new ProviderUserError({
        message: 'Your session is read-only',
      })
    }
    this.assertBucketAllowed(companion.options, bucket)
    if (mutate) this.assertBucketMutable(companion.options, bucket)
    for (const key of keys) this.#assertInsidePrefix(prefix, key)
    return { bucket, prefix, client: this.getClient(companion.options) }
  }

  override async logout(): Promise<{ revoked: true }> {
    return { revoked: true }
  }

  override async simpleAuth({
    requestBody,
    companion,
  }: {
    requestBody: unknown
    companion?: CompanionLike | undefined
  }): Promise<S3UserSession> {
    if (!isRecord(requestBody) || !isRecord(requestBody['form'])) {
      throw new ProviderUserError({ message: 'Invalid request body' })
    }
    const { form } = requestBody
    const s3Options = companion?.options.s3
    const grantSecret = s3Options?.grantSecret

    if (typeof form['grant'] === 'string' && form['grant'].length > 0) {
      if (!grantSecret) {
        throw new ProviderUserError({
          message:
            'This Companion is not configured for storage grants (set `s3.grantSecret` / COMPANION_AWS_GRANT_SECRET)',
        })
      }
      return this.#sessionFromGrant(form['grant'], grantSecret)
    }

    if (grantSecret && !s3Options?.allowBucketAuth) {
      throw new ProviderUserError({
        message: 'This Companion only accepts server-issued grants',
      })
    }
    const bucketInput = typeof form['bucket'] === 'string' ? form['bucket'] : ''
    const parsed = parseBucketInput(bucketInput)
    if (parsed == null) {
      throw new ProviderUserError({
        message:
          'Please provide a bucket name (optionally followed by /prefix)',
      })
    }
    // The bucket allowlist is enforced on every operation (see #session);
    // bucket sessions are unscoped and do not expire.
    return { ...parsed, scopes: [...GRANT_SCOPES] }
  }

  #sessionFromGrant(grant: string, secret: string): S3UserSession {
    let payload: unknown
    try {
      payload = jwt.verify(grant, secret, { algorithms: ['HS256'] })
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        // Expired grants are an auth error so the client asks for a new one.
        throw new ProviderAuthError()
      }
      throw new ProviderUserError({ message: 'Invalid storage grant' })
    }
    const claims = parseGrantClaims(payload)
    return {
      bucket: claims.bucket,
      prefix: claims.prefix,
      scopes: claims.scopes,
      exp: claims.exp,
    }
  }

  override async list({
    companion,
    providerUserSession,
    query,
    directory,
  }: {
    companion: CompanionLike
    providerUserSession: S3UserSession
    query?: Query | undefined
    directory?: string | undefined
  }): Promise<ProviderListResponse> {
    return this.withErrorHandling('provider.s3.list.error', async () => {
      const {
        bucket,
        prefix: rootPrefix,
        client,
      } = this.#session(companion, providerUserSession)

      // `directory` is the (already URL-decoded) key prefix of the folder being
      // listed; the root of the session is the scoped prefix.
      let prefix = directory ? ensureTrailingSlash(directory) : rootPrefix
      // Never allow escaping the scoped prefix.
      if (!prefix.startsWith(rootPrefix)) prefix = rootPrefix

      const cursor =
        typeof query?.['cursor'] === 'string' ? query['cursor'] : undefined

      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          Delimiter: '/',
          MaxKeys: 1000,
          ...(cursor && { ContinuationToken: cursor }),
        }),
      )

      const items: ProviderListItem[] = []

      for (const cp of res.CommonPrefixes ?? []) {
        const key = cp.Prefix
        if (!key) continue
        const name = key.slice(prefix.length).replace(/\/$/, '')
        const requestPath = encodeURIComponent(key)
        items.push({
          isFolder: true,
          icon: 'folder',
          id: requestPath,
          name: name.length > 0 ? name : '/',
          requestPath,
        })
      }

      for (const obj of res.Contents ?? []) {
        const key = obj.Key
        // Skip the "directory placeholder" object (key equal to the prefix).
        if (!key || key === prefix) continue
        const name = key.slice(prefix.length)
        const requestPath = encodeURIComponent(key)
        items.push({
          isFolder: false,
          icon: iconForKey(key),
          id: requestPath,
          name,
          requestPath,
          modifiedDate: obj.LastModified?.toISOString(),
          mimeType: mimeLookup(key) || null,
          size: obj.Size ?? null,
          thumbnail: null,
        })
      }

      const nextPagePath =
        res.IsTruncated && res.NextContinuationToken
          ? `${encodeURIComponent(prefix)}?cursor=${encodeURIComponent(res.NextContinuationToken)}`
          : null

      return { items, nextPagePath, username: bucket }
    })
  }

  override async download({
    companion,
    id,
    providerUserSession,
  }: {
    companion: CompanionLike
    id: string
    providerUserSession: S3UserSession
  }): Promise<{ stream: Readable; size: number | undefined }> {
    return this.withErrorHandling('provider.s3.download.error', async () => {
      const { bucket, client } = this.#session(companion, providerUserSession, {
        keys: [id],
      })
      const res = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: id }),
      )
      if (res.Body == null) {
        throw new ProviderApiError('S3 returned an empty body', 500)
      }
      return { stream: res.Body as Readable, size: res.ContentLength }
    })
  }

  #assertInsidePrefix(prefix: string, key: string): void {
    if (!key.startsWith(prefix) || key.split('/').includes('..')) {
      // A user error (not an auth error) so the Dashboard shows the message
      // instead of bouncing the user to the connect screen.
      throw new ProviderUserError({
        message: 'That path is outside the folder you are allowed to browse',
      })
    }
  }

  async #exists(
    client: S3Client,
    bucket: string,
    key: string,
  ): Promise<boolean> {
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      return true
    } catch (err) {
      if (isNotFound(err)) return false
      throw err
    }
  }

  /** True when anything other than the folder's own marker lives under it. */
  async #folderHasEntries(
    client: S3Client,
    bucket: string,
    folderKey: string,
  ): Promise<boolean> {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: folderKey,
        Delimiter: '/',
        MaxKeys: 2,
      }),
    )
    return (
      (page.CommonPrefixes ?? []).length > 0 ||
      (page.Contents ?? []).some((o) => o.Key !== folderKey)
    )
  }

  async #copyObject(
    client: S3Client,
    bucket: string,
    from: string,
    to: string,
  ): Promise<void> {
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `/${bucket}/${from.split('/').map(encodeURIComponent).join('/')}`,
        Key: to,
      }),
    )
  }

  /**
   * Moves a folder object by object. S3 has no folder move; walking with
   * delimiter listings also carries over empty sub-folders (catalog rows on
   * Transloadit Storage, zero-byte markers on plain S3). Destination folders
   * are created and every object is copied before anything is deleted, so a
   * failure half-way never loses data.
   */
  async #moveFolder(
    client: S3Client,
    bucket: string,
    source: string,
    target: string,
  ): Promise<void> {
    const objects: string[] = []
    const folders: string[] = [source] // parents before children
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i] as string
      for await (const page of paginateListObjectsV2(
        { client },
        { Bucket: bucket, Prefix: folder, Delimiter: '/' },
      )) {
        for (const p of page.CommonPrefixes ?? []) {
          if (p.Prefix) folders.push(p.Prefix)
        }
        for (const o of page.Contents ?? []) {
          if (o.Key && o.Key !== folder) objects.push(o.Key)
        }
        if (objects.length + folders.length > MAX_FOLDER_MOVE_ENTRIES) {
          throw new ProviderUserError({
            message: `This folder has more than ${MAX_FOLDER_MOVE_ENTRIES} entries; move it with an S3 client instead`,
          })
        }
      }
    }
    const renamed = (key: string) => `${target}${key.slice(source.length)}`
    for (const folder of folders) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: renamed(folder),
          Body: '',
        }),
      )
    }
    await pMap(
      objects,
      (key) => this.#copyObject(client, bucket, key, renamed(key)),
      { concurrency: MOVE_CONCURRENCY },
    )
    await pMap(
      objects,
      (key) =>
        client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })),
      { concurrency: MOVE_CONCURRENCY },
    )
    for (const folder of [...folders].reverse()) {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: folder }),
      )
    }
  }

  override async deleteItem({
    companion,
    id,
    providerUserSession,
  }: {
    companion: CompanionLike
    id: string
    providerUserSession: S3UserSession
  }): Promise<void> {
    return this.withErrorHandling('provider.s3.delete.error', async () => {
      const { bucket, client } = this.#session(companion, providerUserSession, {
        mutate: true,
        keys: [id],
      })
      if (
        id.endsWith('/') &&
        (await this.#folderHasEntries(client, bucket, id))
      ) {
        throw new ProviderUserError({ message: 'The folder is not empty' })
      }
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: id }))
    })
  }

  override async moveItem({
    companion,
    id,
    destination,
    providerUserSession,
  }: {
    companion: CompanionLike
    id: string
    destination: string
    providerUserSession: S3UserSession
  }): Promise<{ id: string; requestPath: string }> {
    return this.withErrorHandling('provider.s3.move.error', async () => {
      const { bucket, client } = this.#session(companion, providerUserSession, {
        mutate: true,
        keys: [id, destination],
      })
      const isFolder = id.endsWith('/')
      if (!isFolder && destination.endsWith('/')) {
        throw new ProviderUserError({
          message: 'The destination of a file must be a file path',
        })
      }
      const target = isFolder ? ensureTrailingSlash(destination) : destination
      if (target === id) return { id, requestPath: encodeURIComponent(id) }
      if (isFolder) {
        if (target.startsWith(id)) {
          throw new ProviderUserError({
            message: 'A folder cannot be moved into itself',
          })
        }
        if (
          (await this.#folderHasEntries(client, bucket, target)) ||
          (await this.#exists(client, bucket, target))
        ) {
          throw new ProviderUserError({
            message: `"${target}" already exists`,
          })
        }
        await this.#moveFolder(client, bucket, id, target)
      } else {
        if (await this.#exists(client, bucket, target)) {
          throw new ProviderUserError({
            message: `"${target}" already exists`,
          })
        }
        await this.#copyObject(client, bucket, id, target)
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: id }))
      }
      return { id: target, requestPath: encodeURIComponent(target) }
    })
  }

  override async createFolder({
    companion,
    parentId,
    name,
    providerUserSession,
  }: {
    companion: CompanionLike
    parentId: string | null
    name: string
    providerUserSession: S3UserSession
  }): Promise<{ id: string; requestPath: string }> {
    return this.withErrorHandling(
      'provider.s3.createFolder.error',
      async () => {
        const { bucket, prefix, client } = this.#session(
          companion,
          providerUserSession,
          { mutate: true },
        )
        const cleanName = name.trim().replace(/^\/+|\/+$/g, '')
        if (
          cleanName.length === 0 ||
          cleanName.includes('/') ||
          cleanName === '..' ||
          cleanName === '.'
        ) {
          throw new ProviderUserError({ message: 'Invalid folder name' })
        }
        const parent = parentId ? ensureTrailingSlash(parentId) : prefix
        this.#assertInsidePrefix(prefix, parent)
        const key = `${parent}${cleanName}/`
        if (
          (await this.#folderHasEntries(client, bucket, key)) ||
          (await this.#exists(client, bucket, key))
        ) {
          throw new ProviderUserError({
            message: `A folder named "${cleanName}" already exists`,
          })
        }
        await client.send(
          new PutObjectCommand({ Bucket: bucket, Key: key, Body: '' }),
        )
        return { id: key, requestPath: encodeURIComponent(key) }
      },
    )
  }

  override async thumbnail(): Promise<never> {
    logger.error(
      'call to thumbnail is not implemented',
      'provider.s3.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  protected override mapProviderError(err: unknown): unknown {
    const name = isRecord(err) ? err['name'] : undefined
    const status = isRecord(err)
      ? (err['$metadata'] as { httpStatusCode?: number } | undefined)
          ?.httpStatusCode
      : undefined
    if (
      name === 'NoSuchBucket' ||
      name === 'AccessDenied' ||
      name === 'InvalidAccessKeyId' ||
      status === 403 ||
      status === 404
    ) {
      return new ProviderUserError({
        message: `S3 error: ${String(name ?? status)}`,
      })
    }
    if (status === 409 || status === 400) {
      return new ProviderUserError({
        message: err instanceof Error ? err.message : `S3 error ${status}`,
      })
    }
    if (status != null && !(err instanceof ProviderUserError)) {
      return new ProviderApiError('S3 API error', status)
    }
    return err
  }
}
