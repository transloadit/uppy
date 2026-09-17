import { createHmac } from 'node:crypto'
import type { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  ListObjectsV2Command,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  type S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import got from 'got'
import { lookup as mimeLookup } from 'mime-types'
import { z } from 'zod'
import type {
  S3ConnectionOptions,
  S3ObjectWriteOptions,
  S3ProviderOptions,
  TransloaditStorageProviderOptions,
} from '../../../schemas/companion.js'
import { isRecord } from '../../helpers/type-guards.js'
import { s3WriteParams } from '../../helpers/utils.js'
import logger from '../../logger.js'
import getS3Client, { type S3ClientOptions } from '../../s3-client.js'
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
import {
  ensureTrailingSlash,
  GrantExpiredError,
  type GrantKeys,
  hasGrantKeys,
  normalizeStorageGrantPrefix,
  verifyStorageGrant,
} from './grant.js'

/**
 * Session of the S3 provider. Opened through "simple auth" in one of two ways,
 * decided by Companion's configuration (never by the client):
 * - **grant** mode (`providerOptions.s3.grantSecret` / `grantPublicKey`): the
 *   client presents a short-lived JWT minted by the integrator's server after
 *   it authenticated the user; bucket, prefix and write access come from it.
 * - **bucket** mode (`providerOptions.s3.bucket`): everyone who can reach
 *   Companion gets the configured bucket and prefix.
 */
type S3UserSession = {
  bucket: string
  /** Key prefix the session is confined to: empty, or ending with `/`. */
  prefix: string
  write: boolean
  /** Unix seconds; only grant sessions carry it, to size the session token. */
  exp?: number
}

/** Native Transloadit Storage: catalog moves and per-Workspace credentials. */
type NativeStorage = Pick<
  TransloaditStorageProviderOptions,
  'apiEndpoint' | 'workspaces'
>

type ResolvedConfig = {
  clientOptions: { s3: S3ClientOptions }
  /** Object attributes Companion sets when it writes (copies, folder markers). */
  writeParams: ReturnType<typeof s3WriteParams>
  /** Set for the `transloadit-storage` provider. */
  native?: NativeStorage
} & (
  | { mode: 'grant'; keys: GrantKeys }
  | { mode: 'bucket'; bucket: string; prefix: string }
)

/**
 * The settings the provider may set on top of the `s3` upload block, as
 * records so that a field added to the shared option types without being
 * listed here fails to compile.
 */
const CONNECTION_KEYS: Record<keyof S3ConnectionOptions, true> = {
  key: true,
  secret: true,
  sessionToken: true,
  region: true,
  endpoint: true,
  forcePathStyle: true,
  awsClientOptions: true,
}
const WRITE_KEYS: Record<keyof S3ObjectWriteOptions, true> = {
  acl: true,
  awsSse: true,
  awsSseKmsKeyId: true,
}

/** The listed fields of `source` that are set. */
const pickDefined = <T extends object, K extends keyof T>(
  source: T,
  keys: Record<K, true>,
): Partial<Pick<T, K>> =>
  Object.fromEntries(
    (Object.keys(keys) as K[])
      .filter((key) => source[key] != null)
      .map((key) => [key, source[key]]),
  ) as Partial<Pick<T, K>>

/** `CopyObject` refuses sources above this size; larger objects need a multipart copy. */
const MAX_COPY_BYTES = 5 * 1024 ** 3

const isContentEtag = (etag: string): boolean =>
  /^"?[0-9a-f]{32}(-\d+)?"?$/i.test(etag)

const isPreconditionFailed = (err: unknown): boolean =>
  err instanceof S3ServiceException &&
  (err.$metadata.httpStatusCode === 412 || err.$metadata.httpStatusCode === 409)

const isNotFound = (err: unknown): boolean =>
  err instanceof NotFound ||
  err instanceof NoSuchKey ||
  (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404)

/**
 * Something the operator has to fix. The details go to Companion's log; the
 * browser only gets a generic, translatable message.
 */
const operatorError = (details: string): ProviderUserError => {
  logger.error(details, 'provider.s3.config')
  return new ProviderUserError({ message: 's3NotConfigured' })
}

type ProviderOptionsKey = 's3' | 'transloadit-storage'

const resolveConfig = (
  companion: CompanionLike,
  optionsKey: ProviderOptionsKey,
): ResolvedConfig => {
  const upload = companion.options.s3
  const own: S3ProviderOptions | TransloaditStorageProviderOptions | undefined =
    companion.options.providerOptions?.[optionsKey]
  if (own == null || typeof own !== 'object') {
    throw operatorError(
      `The ${optionsKey} provider is not configured: set \`providerOptions['${optionsKey}']\``,
    )
  }
  // The provider's own settings win; anything unset comes from the upload block.
  const s3 = {
    ...upload,
    // Browsing goes to the plain endpoint; transfer acceleration is an upload concern.
    useAccelerateEndpoint: false,
    ...pickDefined(own as S3ConnectionOptions, CONNECTION_KEYS),
  }
  const clientOptions = { s3 }
  const writeParams = s3WriteParams({
    ...upload,
    ...pickDefined(own as S3ObjectWriteOptions, WRITE_KEYS),
  })
  const keys: GrantKeys = {
    secrets: own.grantSecret,
    publicKeys: own.grantPublicKey,
  }
  if (optionsKey === 'transloadit-storage') {
    // Native Storage: grants only, and Companion must hold every Workspace's key.
    const { apiEndpoint, workspaces } = own as TransloaditStorageProviderOptions
    if (!hasGrantKeys(keys)) {
      throw operatorError(
        'The transloadit-storage provider needs a grant key (`grantSecret` / `grantPublicKey`); it does not take a `bucket`',
      )
    }
    if (typeof apiEndpoint !== 'string' || !isRecord(workspaces)) {
      throw operatorError(
        "The transloadit-storage provider needs `apiEndpoint` and `workspaces` under providerOptions['transloadit-storage']",
      )
    }
    return {
      mode: 'grant',
      keys,
      clientOptions,
      writeParams,
      native: { apiEndpoint, workspaces },
    }
  }
  if (hasGrantKeys(keys)) {
    return { mode: 'grant', keys, clientOptions, writeParams }
  }
  const { bucket, prefix } = own as S3ProviderOptions
  if (typeof bucket === 'string' && bucket.length > 0) {
    return {
      mode: 'bucket',
      bucket,
      prefix: normalizeStorageGrantPrefix(prefix ?? ''),
      clientOptions,
      writeParams,
    }
  }
  throw operatorError(
    'The S3 provider needs either `providerOptions.s3.bucket` or a grant key (`grantSecret` / `grantPublicKey`)',
  )
}

/**
 * Configuration and client, resolved once per Companion `app()` — there is one
 * options object per app, and neither the merge nor `new S3Client()` is worth
 * redoing on every request. The trade-off: an embedder that mutates the
 * options object at runtime is not picked up.
 */
type CacheEntry = { config: ResolvedConfig; clients: Map<string, S3Client> }

const perOptions = new WeakMap<object, CacheEntry>()

/**
 * Adapter for browsing and managing S3-compatible object storage (AWS S3,
 * Cloudflare R2, MinIO, Transloadit Storage, ...). Configured under
 * `providerOptions.s3`; credentials left unset there fall back to the `s3`
 * upload block. Bucket-level permissions are the job of IAM / bucket policies
 * on those credentials: Companion only enforces the per-user prefix and write
 * flag carried by grants.
 */
export default class S3Provider extends Provider<S3UserSession> {
  /** Where this provider's options live under `providerOptions`. */
  protected get optionsKey(): ProviderOptionsKey {
    return 's3'
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
      providerUserSession.bucket.length > 0 &&
      typeof providerUserSession.prefix === 'string' &&
      typeof providerUserSession.write === 'boolean'
    )
  }

  /** Overridable for tests. */
  getClient(clientOptions: { s3?: S3ClientOptions | undefined }): S3Client {
    const client = getS3Client(clientOptions)
    if (client == null) {
      throw operatorError(
        'The S3 provider has no region: set `providerOptions.s3.region` (or `s3.region`)',
      )
    }
    return client
  }

  /** The cache entry for this Companion app, filling it on first use. */
  #entry(companion: CompanionLike): CacheEntry {
    const cached = perOptions.get(companion.options)
    if (cached != null) return cached
    // Deliberately outside the cache: a misconfigured provider keeps
    // reporting itself on every request.
    const entry: CacheEntry = {
      config: resolveConfig(companion, this.optionsKey),
      clients: new Map(),
    }
    perOptions.set(companion.options, entry)
    return entry
  }

  /** The key pair Companion holds for a Workspace (native Storage only). */
  #workspaceCredentials(
    native: NativeStorage,
    workspace: string,
  ): { key: string; secret: string } {
    const credentials = Object.hasOwn(native.workspaces, workspace)
      ? native.workspaces[workspace]
      : undefined
    if (credentials == null) {
      throw operatorError(
        `No credentials for Workspace "${workspace}" under providerOptions['transloadit-storage'].workspaces`,
      )
    }
    return credentials
  }

  #config(companion: CompanionLike): ResolvedConfig {
    return this.#entry(companion).config
  }

  #client(companion: CompanionLike, bucket: string): S3Client {
    const entry = this.#entry(companion)
    const { config } = entry
    // Plain S3 uses one key for every bucket; native Storage one per Workspace.
    const cacheKey = config.native ? bucket : ''
    let client = entry.clients.get(cacheKey)
    if (client == null) {
      let { clientOptions } = config
      if (config.native) {
        const { key, secret } = this.#workspaceCredentials(
          config.native,
          bucket,
        )
        clientOptions = { s3: { ...clientOptions.s3, key, secret } }
      }
      client = this.getClient(clientOptions)
      entry.clients.set(cacheKey, client)
    }
    return client
  }

  /**
   * Every operation starts here: a session that matches the current
   * configuration, write access when `requireWrite`, and every key inside the
   * session's prefix.
   */
  #session(
    companion: CompanionLike,
    providerUserSession: S3UserSession,
    { requireWrite = false, keys = [] as string[] } = {},
  ): {
    bucket: string
    prefix: string
    client: S3Client
    writeParams: ResolvedConfig['writeParams']
    native: NativeStorage | undefined
  } {
    const config = this.#config(companion)
    if (!this.isAuthenticated({ providerUserSession })) {
      throw new ProviderAuthError()
    }
    const { bucket, prefix, write } = providerUserSession
    // A session opened under an earlier configuration (other bucket or
    // prefix, or before grants were configured) has to be reopened.
    if (
      config.mode === 'bucket' &&
      (bucket !== config.bucket || prefix !== config.prefix)
    ) {
      throw new ProviderAuthError()
    }
    if (requireWrite && !write) {
      // A user error, not an auth error: a fresh session would not help.
      throw new ProviderUserError({ message: 's3ReadOnlySession' })
    }
    for (const key of keys) this.#assertInsidePrefix(prefix, key)
    return {
      bucket,
      prefix,
      client: this.#client(companion, bucket),
      writeParams: config.writeParams,
      native: config.native,
    }
  }

  override async logout(): Promise<{ revoked: true }> {
    return { revoked: true }
  }

  override async simpleAuth({
    requestBody,
    companion,
  }: {
    requestBody: unknown
    companion: CompanionLike
  }): Promise<S3UserSession> {
    const config = this.#config(companion)
    if (config.mode === 'bucket') {
      return { bucket: config.bucket, prefix: config.prefix, write: true }
    }
    const form =
      isRecord(requestBody) && isRecord(requestBody['form'])
        ? requestBody['form']
        : {}
    const grant = form['grant']
    if (typeof grant !== 'string' || grant.length === 0) {
      throw new ProviderUserError({ message: 's3InvalidGrant' })
    }
    try {
      const claims = verifyStorageGrant(grant, config.keys)
      return {
        bucket: claims.bucket,
        prefix: claims.prefix,
        write: claims.write,
        // Sizes the session token: it expires with the grant.
        exp: claims.exp,
      }
    } catch (err) {
      // Expired grants are an auth error so the client asks for a new one.
      if (err instanceof GrantExpiredError) throw new ProviderAuthError()
      logger.debug(err, 'provider.s3.grant.invalid')
      throw new ProviderUserError({ message: 's3InvalidGrant' })
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
      // `directory` is the (already URL-decoded) key prefix of the folder
      // being listed; the root of the session is its prefix.
      const {
        bucket,
        prefix: rootPrefix,
        client,
        native,
      } = this.#session(companion, providerUserSession, {
        keys: directory ? [ensureTrailingSlash(directory)] : [],
      })
      const prefix = directory ? ensureTrailingSlash(directory) : rootPrefix

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
        const mimeType = mimeLookup(key) || null
        items.push({
          isFolder: false,
          icon: mimeType?.startsWith('video/') ? 'video' : 'file',
          id: requestPath,
          name,
          requestPath,
          modifiedDate: obj.LastModified?.toISOString(),
          mimeType,
          size: obj.Size ?? null,
          thumbnail: null,
        })
      }

      const nextPagePath =
        res.IsTruncated && res.NextContinuationToken
          ? `${encodeURIComponent(prefix)}?cursor=${encodeURIComponent(res.NextContinuationToken)}`
          : null

      return {
        items,
        nextPagePath,
        username: bucket,
        // The client shows write actions only when the session allows them,
        // and resolves paths the user types against the session's root.
        canWrite: providerUserSession.write,
        movesFolders: native != null,
        prefix: rootPrefix,
      }
    })
  }

  override async download({
    companion,
    id,
    query,
    providerUserSession,
  }: {
    companion: CompanionLike
    id: string
    query?: unknown
    providerUserSession: S3UserSession
  }): Promise<{ stream: Readable; size: number | undefined }> {
    return this.withErrorHandling('provider.s3.download.error', async () => {
      const { bucket, client } = this.#session(companion, providerUserSession, {
        keys: [id],
      })
      // A queued file outlives the browser session that selected it. Its key
      // must never be read from a bucket the user connected to later.
      if (!isRecord(query) || query['bucket'] !== bucket) {
        throw new ProviderUserError({ message: 's3SelectedInOtherSession' })
      }
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
      throw new ProviderUserError({ message: 's3OutsideAllowedFolder' })
    }
  }

  async #head(
    client: S3Client,
    bucket: string,
    key: string,
  ): Promise<HeadObjectCommandOutput | null> {
    try {
      return await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      )
    } catch (err) {
      if (isNotFound(err)) return null
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
        requireWrite: true,
        keys: [id],
      })
      if (
        id.endsWith('/') &&
        (await this.#folderHasEntries(client, bucket, id))
      ) {
        throw new ProviderUserError({ message: 's3FolderNotEmpty' })
      }
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: id }))
    })
  }

  /**
   * Moves or renames one object: copy, then delete the source. Folders are
   * moved by the client, item by item. Re-running an interrupted move works:
   * a destination that already holds the same object only needs the source
   * deleted.
   */
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
      const { bucket, client, writeParams, native } = this.#session(
        companion,
        providerUserSession,
        { requireWrite: true, keys: [id, destination] },
      )
      if (native) {
        return this.#nativeMove(native, bucket, id, destination)
      }
      if (id.endsWith('/')) {
        throw new ProviderUserError({ message: 's3FolderMoveNotSupported' })
      }
      if (destination.endsWith('/')) {
        throw new ProviderUserError({ message: 's3DestinationMustBeFile' })
      }
      const result = {
        id: destination,
        requestPath: encodeURIComponent(destination),
      }
      if (destination === id) return result

      const [source, existing] = await Promise.all([
        this.#head(client, bucket, id),
        this.#head(client, bucket, destination),
      ])
      if (source == null) {
        throw new ProviderUserError({ message: 's3NotFound' })
      }
      if ((source.ContentLength ?? 0) > MAX_COPY_BYTES) {
        throw new ProviderUserError({ message: 's3FileTooLargeToMove' })
      }
      if (existing != null) {
        // Same size and ETag: the copy already happened (an earlier attempt
        // stopped before deleting the source). Anything else is a conflict.
        // (Under SSE-KMS a copy gets a new ETag, so a resumed move of such an
        // object reports a conflict rather than deleting the source.)
        // Only trust ETags that look like S3's own (an MD5, or MD5-partcount
        // for multipart uploads): a backend answering a placeholder for every
        // object would otherwise have the source deleted without a copy.
        const sameObject =
          existing.ContentLength === source.ContentLength &&
          existing.ETag != null &&
          existing.ETag === source.ETag &&
          isContentEtag(existing.ETag)
        if (!sameObject) {
          throw new ProviderUserError({ message: 's3AlreadyExists' })
        }
      } else {
        await client.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `/${bucket}/${id.split('/').map(encodeURIComponent).join('/')}`,
            Key: destination,
            // The HEADs above are a friendly early check; these conditions are
            // the write barrier where the endpoint honours them: never
            // overwrite the destination, and copy exactly what was inspected.
            IfNoneMatch: '*',
            ...(source.ETag != null && { CopySourceIfMatch: source.ETag }),
            ...writeParams,
          }),
        )
      }
      // Delete only the object that was copied; a source replaced meanwhile
      // stays put and the user gets a conflict.
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: id,
          ...(source.ETag != null && { IfMatch: source.ETag }),
        }),
      )
      return result
    })
  }

  /**
   * One signed call to Transloadit's catalog moves a file or a whole folder
   * and keeps asset identity; it never falls back to S3 copy/delete.
   */
  async #nativeMove(
    native: NativeStorage,
    workspace: string,
    id: string,
    destination: string,
  ): Promise<{ id: string; requestPath: string }> {
    const isFolder = id.endsWith('/')
    const target = isFolder ? ensureTrailingSlash(destination) : destination
    if (!isFolder && destination.endsWith('/')) {
      throw new ProviderUserError({ message: 's3DestinationMustBeFile' })
    }
    if (isFolder && target.startsWith(id)) {
      throw new ProviderUserError({ message: 's3FolderIntoItself' })
    }
    if (target === id) return { id, requestPath: encodeURIComponent(id) }
    const { key, secret } = this.#workspaceCredentials(native, workspace)
    const params = JSON.stringify({
      auth: { key, expires: new Date(Date.now() + 60_000).toISOString() },
      source: id,
      destination: target,
    })
    const signature = `sha256:${createHmac('sha256', secret).update(params, 'utf8').digest('hex')}`
    const response = await got.post(
      new URL('/dam/entries/move', native.apiEndpoint),
      {
        form: { params, signature },
        timeout: { request: 30_000 },
        retry: { limit: 0 },
        followRedirect: false,
        throwHttpErrors: false,
        responseType: 'json',
      },
    )
    if (response.statusCode >= 500) {
      throw new ProviderApiError('Storage is temporarily unavailable', 502)
    }
    if (response.statusCode !== 200) {
      logger.warn(
        `native Storage move refused: ${response.statusCode}`,
        'provider.s3.nativeMove',
      )
      throw new ProviderUserError({ message: 's3RequestFailed' })
    }
    const moved = z
      .object({ ok: z.literal('DAM_ENTRY_MOVED'), path: z.string().min(1) })
      .safeParse(response.body)
    if (!moved.success || moved.data.path !== target) {
      throw new ProviderApiError('Unexpected native Storage move response', 502)
    }
    return { id: target, requestPath: encodeURIComponent(target) }
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
        const { bucket, prefix, client, writeParams } = this.#session(
          companion,
          providerUserSession,
          {
            requireWrite: true,
            keys: parentId ? [ensureTrailingSlash(parentId)] : [],
          },
        )
        const cleanName = name.trim().replace(/^\/+|\/+$/g, '')
        if (
          cleanName.length === 0 ||
          cleanName.includes('/') ||
          cleanName.includes('\\') ||
          cleanName === '..' ||
          cleanName === '.'
        ) {
          throw new ProviderUserError({ message: 's3InvalidName' })
        }
        const parent = parentId ? ensureTrailingSlash(parentId) : prefix
        const key = `${parent}${cleanName}/`
        // Without a delimiter one entry is enough to tell: it is either the
        // folder's own marker or something already stored under it.
        const taken = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: key,
            MaxKeys: 1,
          }),
        )
        if ((taken.Contents ?? []).length > 0) {
          throw new ProviderUserError({ message: 's3AlreadyExists' })
        }
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: '',
            IfNoneMatch: '*',
            ...writeParams,
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

  /**
   * Companion's own errors pass through. Of S3's, only "not found" is the
   * user's business; everything else (permissions, wrong endpoint, throttling)
   * is reported to the browser generically — the original goes to Companion's
   * log, which `withErrorHandling` takes care of.
   */
  protected override mapProviderError(err: unknown): unknown {
    if (err instanceof ProviderApiError) return err
    if (isNotFound(err)) return new ProviderUserError({ message: 's3NotFound' })
    if (isPreconditionFailed(err)) {
      return new ProviderUserError({ message: 's3Conflict' })
    }
    return new ProviderUserError({ message: 's3RequestFailed' })
  }
}

/**
 * Transloadit Storage: the S3 provider on Storage's S3-compatible endpoint,
 * with native catalog moves and one key pair per Workspace. Configured under
 * `providerOptions['transloadit-storage']`.
 */
export class TransloaditStorageProvider extends S3Provider {
  protected override get optionsKey(): ProviderOptionsKey {
    return 'transloadit-storage'
  }
}
