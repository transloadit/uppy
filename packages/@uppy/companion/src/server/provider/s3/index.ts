import type { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  paginateListObjectsV2,
  type S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import {
  normalizeStorageGrantPrefix,
  STORAGE_GRANT_SCOPES,
  type StorageGrantClaims,
  type StorageGrantScope,
  signParamsSync,
  verifyStorageGrant,
} from '@transloadit/utils/node'
import got from 'got'
import { lookup as mimeLookup } from 'mime-types'
import pMap from 'p-map'
import { z } from 'zod'
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

/**
 * Session for the S3 provider, created via "simple auth" (non-OAuth) in one
 * of two ways:
 * - a **grant**: a short-lived JWT minted by the integrator's server after it
 *   authenticated the user, carrying the bucket, the prefix the user may see
 *   and the scopes they hold (see `StorageGrantClaims`). This is the multi-tenant path.
 * - a **bucket** (`my-bucket/optional/prefix`) typed or configured on the
 *   client. Only accepted when Companion is not configured for grants, or
 *   `s3.allowBucketAuth` is set (development).
 */
type S3UserSession = {
  bucket: string
  prefix: string
  /** Missing on bucket sessions and on tokens from before grants existed. */
  scopes?: StorageGrantScope[]
  /** Unix seconds; only grant sessions expire. */
  exp?: number
}

/** Claims of a storage grant (`s3.grantSecret`, HS256). */

type CompanionS3Options = Pick<CompanionRuntimeOptions, 's3'>

const ensureTrailingSlash = (s: string): string =>
  s.length === 0 || s.endsWith('/') ? s : `${s}/`

/** Upper bound on the entries (objects + folders) a folder move may touch. */
const MAX_FOLDER_MOVE_ENTRIES = 1000
/** How many S3 calls a folder move runs at once. */
const MOVE_CONCURRENCY = 8

const isNotFound = (err: unknown): boolean =>
  err instanceof NotFound ||
  err instanceof NoSuchKey ||
  (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404)

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
  protected get nativeStorage(): boolean {
    return false
  }
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

  getClient(companionOptions: CompanionS3Options, bucket?: string): S3Client {
    if (this.nativeStorage) {
      const credentials = this.#storageCredentials(companionOptions, bucket)
      companionOptions = {
        ...companionOptions,
        s3: {
          ...companionOptions.s3,
          key: credentials.key,
          secret: credentials.secret,
          awsClientOptions: {
            ...companionOptions.s3?.awsClientOptions,
            credentials: {
              accessKeyId: credentials.key,
              secretAccessKey: credentials.secret,
            },
          },
        },
      }
    }
    const client = getS3Client(companionOptions)
    if (client == null) {
      throw new ProviderUserError({
        message:
          'Companion is not configured for S3 (missing `s3` options such as region)',
      })
    }
    return client
  }

  #storageCredentials(
    options: CompanionS3Options,
    workspace: string | undefined,
  ): { key: string; secret: string } {
    const workspaces = options.s3?.transloaditStorage?.workspaces
    if (
      workspace === undefined ||
      !workspaces ||
      !Object.hasOwn(workspaces, workspace) ||
      !workspaces[workspace]
    ) {
      throw new ProviderUserError({
        message:
          'This Companion has no native Storage credentials for this Workspace',
      })
    }
    return workspaces[workspace]
  }

  async #moveStorageEntry(
    options: CompanionS3Options,
    workspace: string,
    source: string,
    destination: string,
  ): Promise<string> {
    const credentials = this.#storageCredentials(options, workspace)
    const endpoint = options.s3?.transloaditStorage?.apiEndpoint
    if (!endpoint)
      throw new ProviderUserError({
        message: 'Native Storage management is not configured',
      })
    const params = JSON.stringify({
      auth: {
        key: credentials.key,
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
      source,
      destination,
    })
    const response = await got.post(new URL('/dam/entries/move', endpoint), {
      form: {
        params,
        signature: signParamsSync(params, credentials.secret, 'sha256'),
      },
      timeout: { request: 30_000 },
      retry: { limit: 0 },
      followRedirect: false,
      throwHttpErrors: false,
      responseType: 'json',
    })
    if (response.statusCode !== 200) {
      throw new ProviderUserError({
        message:
          'Storage could not move this item. Refresh the folder and check your access and destination.',
      })
    }
    const moved = z
      .object({ ok: z.literal('DAM_ENTRY_MOVED'), path: z.string().min(1) })
      .safeParse(response.body)
    if (!moved.success)
      throw new ProviderApiError('Invalid native Storage move response', 502)
    if (moved.data.path !== destination)
      throw new ProviderApiError(
        'Storage move returned an unexpected path',
        502,
      )
    return moved.data.path
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
    return { bucket, prefix, client: this.getClient(companion.options, bucket) }
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

    if ((this.nativeStorage || grantSecret) && !s3Options?.allowBucketAuth) {
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
    return { ...parsed, scopes: [...STORAGE_GRANT_SCOPES] }
  }

  #sessionFromGrant(grant: string, secret: string): S3UserSession {
    let claims: StorageGrantClaims
    try {
      claims = verifyStorageGrant(grant, secret)
    } catch (err) {
      if (err instanceof Error && /expired/i.test(err.message)) {
        // Expired grants are an auth error so the client asks for a new one.
        throw new ProviderAuthError()
      }
      throw new ProviderUserError({ message: 'Invalid storage grant' })
    }
    return {
      bucket: claims.bucket,
      prefix: normalizeStorageGrantPrefix(claims.prefix),
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
      const prefix = directory ? ensureTrailingSlash(directory) : rootPrefix
      // Never allow escaping the scoped prefix.
      this.#assertInsidePrefix(rootPrefix, prefix)

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

      const mutableBuckets = companion.options.s3?.mutableBuckets ?? []
      const canMutate =
        (mutableBuckets.includes('*') || mutableBuckets.includes(bucket)) &&
        (providerUserSession.scopes?.includes('write') ?? true)
      return { items, nextPagePath, username: bucket, canMutate }
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
    if (
      !key.startsWith(prefix) ||
      key.includes('\\') ||
      key.split('/').some((part) => part === '..' || part === '.')
    ) {
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
    options: CompanionRuntimeOptions,
    etag: string,
  ): Promise<void> {
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `/${bucket}/${from.split('/').map(encodeURIComponent).join('/')}`,
        Key: to,
        // The HEAD preflight is only a friendly error. This condition is the write barrier.
        IfNoneMatch: '*',
        CopySourceIfMatch: etag,
        ...this.#writePolicy(options),
      }),
    )
  }

  #writePolicy(options: CompanionRuntimeOptions) {
    const s3 = options.s3
    return {
      ...(s3?.acl != null && { ACL: s3.acl }),
      ...(s3?.awsSse != null && { ServerSideEncryption: s3.awsSse }),
      ...(s3?.awsSseKmsKeyId != null && { SSEKMSKeyId: s3.awsSseKmsKeyId }),
    }
  }

  #assertCopySize(size: number | undefined): void {
    if (size !== undefined && size > 5 * 1024 ** 3)
      throw new ProviderUserError({
        message:
          'This object exceeds the 5 GB single-copy limit. Use an S3 client with multipart copy; no source files were deleted.',
      })
  }

  #requireCopyEtag(etag: string | undefined): string {
    if (!etag)
      throw new ProviderUserError({
        message:
          'The storage provider did not return an ETag. A safe move is unavailable; use an S3 client instead. No source files were deleted.',
      })
    return etag
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
    options: CompanionRuntimeOptions,
  ): Promise<void> {
    const objects: { key: string; etag: string }[] = []
    const markers = new Map<string, string>()
    const folders: string[] = [source] // parents before children
    for (const folder of folders) {
      for await (const page of paginateListObjectsV2(
        { client },
        { Bucket: bucket, Prefix: folder, Delimiter: '/' },
      )) {
        for (const p of page.CommonPrefixes ?? []) {
          if (p.Prefix) folders.push(p.Prefix)
        }
        for (const o of page.Contents ?? []) {
          this.#assertCopySize(o.Size)
          if (o.Key === folder)
            markers.set(folder, this.#requireCopyEtag(o.ETag))
          else if (o.Key)
            objects.push({ key: o.Key, etag: this.#requireCopyEtag(o.ETag) })
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
          IfNoneMatch: '*',
          ...this.#writePolicy(options),
        }),
      )
    }
    await pMap(
      objects,
      ({ key, etag }) =>
        this.#copyObject(client, bucket, key, renamed(key), options, etag),
      { concurrency: MOVE_CONCURRENCY },
    )
    await pMap(
      objects,
      ({ key, etag }) =>
        client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key, IfMatch: etag }),
        ),
      { concurrency: MOVE_CONCURRENCY },
    )
    for (const folder of folders.toReversed()) {
      const etag = markers.get(folder)
      if (!etag) continue
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: folder, IfMatch: etag }),
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
      if (this.nativeStorage) {
        const path = await this.#moveStorageEntry(
          companion.options,
          bucket,
          id,
          target,
        )
        return { id: path, requestPath: encodeURIComponent(path) }
      }
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
        await this.#moveFolder(client, bucket, id, target, companion.options)
      } else {
        if (await this.#exists(client, bucket, target)) {
          throw new ProviderUserError({
            message: `"${target}" already exists`,
          })
        }
        const source = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: id }),
        )
        this.#assertCopySize(source.ContentLength)
        const etag = this.#requireCopyEtag(source.ETag)
        await this.#copyObject(
          client,
          bucket,
          id,
          target,
          companion.options,
          etag,
        )
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: id, IfMatch: etag }),
        )
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
          cleanName.includes('\\') ||
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
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: '',
            IfNoneMatch: '*',
            ...this.#writePolicy(companion.options),
          }),
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
    if (status === 409 || status === 412) {
      return new ProviderUserError({
        message:
          'The source or destination changed during this operation. Refresh the folder and check both paths before retrying; the conflicting source was not deleted.',
      })
    }
    if (status === 400)
      return new ProviderUserError({
        message:
          'The storage provider rejected this operation. Check its supported S3 operations and bucket configuration.',
      })
    if (status != null && !(err instanceof ProviderUserError)) {
      return new ProviderApiError('S3 API error', status)
    }
    return err
  }
}

/** Separate provider/session namespace: native Storage never falls back to S3 copy/delete. */
export class TransloaditStorageProvider extends S3Provider {
  protected override get nativeStorage(): boolean {
    return true
  }
}
