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
import { lookup as mimeLookup } from 'mime-types'
import { z } from 'zod'
import type {
  CompanionInitOptions,
  S3ClientOptions,
  S3ConnectionOptions,
  S3ObjectWriteOptions,
} from '../../../schemas/companion.js'
import { isRecord } from '../../helpers/type-guards.js'
import { s3WriteParams } from '../../helpers/utils.js'
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
import {
  type ParsedS3ProviderOptions,
  parseS3ProviderOptions,
  S3ConfigError,
} from './config.js'
import {
  ensureTrailingSlash,
  GrantExpiredError,
  verifyStorageGrant,
} from './grant.js'

/**
 * Session of the S3 provider, opened through "simple auth" (see `config.ts`).
 * Checked at runtime because it comes back from the client inside Companion's
 * session token, which may predate the current version.
 */
const userSessionSchema = z.object({
  bucket: z.string().min(1),
  /** Key prefix the session is confined to: empty, or ending with `/`. */
  prefix: z.string(),
  write: z.boolean(),
  /** Unix seconds; only grant sessions carry it, to size the session token. */
  exp: z.number().optional(),
})

export type S3UserSession = z.infer<typeof userSessionSchema>

/** Object attributes Companion sets when it writes (copies, folder markers). */
type WriteParams = ReturnType<typeof s3WriteParams>

/** The parsed provider options plus what every request needs from them. */
export type ResolvedConfig<P extends ParsedS3ProviderOptions> = P & {
  clientOptions: S3ClientOptions
  writeParams: WriteParams
}

/** What every operation starts from: a checked session and its client. */
export type S3Session<P extends ParsedS3ProviderOptions> = {
  bucket: string
  prefix: string
  client: S3Client
  config: ResolvedConfig<P>
}

type SessionChecks = {
  requireWrite?: boolean
  /** Keys the request names; each must lie inside the session's prefix. */
  keys?: string[]
}

export type ItemRef = { id: string; requestPath: string }

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
 * S3 allows `\` and `.`/`..` segments in keys, but the session's prefix is a
 * plain string boundary and some S3-compatible endpoints, proxies and URL
 * handling resolve dot segments. Rather than trust every layer not to, such
 * keys are refused; objects named that way stay off-limits to Companion.
 */
const hasUnsafeSegment = (key: string): boolean =>
  key.includes('\\') ||
  key.split('/').some((part) => part === '..' || part === '.')

const itemRef = (key: string): ItemRef => ({
  id: key,
  requestPath: encodeURIComponent(key),
})

/**
 * S3 clients per Companion `app()`, and within an app per provider and
 * bucket. A client is cheap to build but holds what is not: its resolved
 * credentials (a metadata or STS round trip when Companion runs on a role)
 * and its keep-alive connections. The configuration itself is re-derived on
 * every request; that is a small parse.
 *
 * Keyed on the app's options object because that is the one per-app value a
 * provider sees: `req.companion` is rebuilt for every request. The
 * trade-off: an embedder that swaps credentials in the options object at
 * runtime keeps the clients built with the old ones.
 */
const clientsByApp = new WeakMap<object, Map<string, S3Client>>()

/**
 * Adapter for browsing and managing S3-compatible object storage (AWS S3,
 * Cloudflare R2, MinIO, ...). Configured under `providerOptions.s3`;
 * credentials left unset there fall back to the `s3` upload block.
 * Bucket-level permissions are the job of IAM / bucket policies on those
 * credentials: Companion only enforces the per-user prefix and write flag
 * carried by grants.
 *
 * Backends with more than plain S3 (Transloadit Storage) subclass this and
 * override the `protected` seams: how their options parse, which client
 * serves a bucket, and how a move is carried out.
 */
export default class S3Provider<
  P extends ParsedS3ProviderOptions = ParsedS3ProviderOptions,
> extends Provider<S3UserSession> {
  /** Where this provider's options live under `providerOptions`. */
  protected get optionsKey(): keyof NonNullable<
    CompanionInitOptions['providerOptions']
  > {
    return 's3'
  }

  static override get hasSimpleAuth() {
    return true
  }

  static override get supportsMutations() {
    return true
  }

  /** Validates and parses this provider's own options block. */
  protected parseOptions(own: unknown): P {
    return parseS3ProviderOptions(own) as P
  }

  /** Whether `moveItem` takes a folder and moves everything under it. */
  protected get supportsMoveFolder(): boolean {
    return false
  }

  /** The client options for `bucket`, and the key that client is cached under. */
  protected clientOptionsFor(
    config: ResolvedConfig<P>,
    _bucket: string,
  ): { cacheKey: string; clientOptions: S3ClientOptions } {
    return { cacheKey: '', clientOptions: config.clientOptions }
  }

  isAuthenticated({
    providerUserSession,
  }: {
    providerUserSession: S3UserSession | undefined
  }): boolean {
    return userSessionSchema.safeParse(providerUserSession).success
  }

  /** Overridable for tests. */
  getClient(clientOptions: S3ClientOptions): S3Client {
    const client = getS3Client({ s3: clientOptions })
    if (client == null) {
      throw new S3ConfigError(
        `The ${this.optionsKey} provider has no region: set \`providerOptions['${this.optionsKey}'].region\` (or \`s3.region\`)`,
      )
    }
    return client
  }

  #config(companion: CompanionLike): ResolvedConfig<P> {
    // Typed as what this method reads from it; `parseOptions` checks the rest.
    const own: (S3ConnectionOptions & S3ObjectWriteOptions) | undefined =
      companion.options.providerOptions?.[this.optionsKey]
    if (own == null) {
      throw new S3ConfigError(
        `The ${this.optionsKey} provider is not configured: set \`providerOptions['${this.optionsKey}']\``,
      )
    }
    const parsed = this.parseOptions(own)
    // The provider's own settings win; anything unset comes from the upload
    // block. Only the connection and write settings are read from it.
    const fallback: S3ConnectionOptions & S3ObjectWriteOptions =
      companion.options.s3 ?? {}
    return {
      ...parsed,
      clientOptions: {
        ...pickDefined(fallback, CONNECTION_KEYS),
        // Browsing goes to the plain endpoint; acceleration is an upload concern.
        useAccelerateEndpoint: false,
        ...pickDefined(own, CONNECTION_KEYS),
      },
      writeParams: s3WriteParams({
        ...pickDefined(fallback, WRITE_KEYS),
        ...pickDefined(own, WRITE_KEYS),
      }),
    }
  }

  #client(
    companion: CompanionLike,
    config: ResolvedConfig<P>,
    bucket: string,
  ): S3Client {
    let appClients = clientsByApp.get(companion.options)
    if (appClients == null) {
      appClients = new Map()
      clientsByApp.set(companion.options, appClients)
    }
    const { cacheKey, clientOptions } = this.clientOptionsFor(config, bucket)
    // Provider names and bucket names cannot contain `/`, so the two cannot collide.
    const key = `${this.optionsKey}/${cacheKey}`
    let client = appClients.get(key)
    if (client == null) {
      client = this.getClient(clientOptions)
      appClients.set(key, client)
    }
    return client
  }

  /**
   * Every operation starts here: a session that matches the current
   * configuration, write access when `requireWrite`, and every key inside the
   * session's prefix.
   */
  protected session(
    companion: CompanionLike,
    providerUserSession: S3UserSession,
    { requireWrite = false, keys = [] }: SessionChecks = {},
  ): S3Session<P> {
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
      client: this.#client(companion, config, bucket),
      config,
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
    // Only the configuration goes through the error wrapper: a grant that
    // does not verify is the client's doing, not something to log as an error.
    const config = await this.withErrorHandling(
      'provider.s3.auth.error',
      async () => this.#config(companion),
    )
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
      const folder = directory ? ensureTrailingSlash(directory) : undefined
      const {
        bucket,
        prefix: rootPrefix,
        client,
      } = this.session(companion, providerUserSession, {
        keys: folder ? [folder] : [],
      })
      const prefix = folder ?? rootPrefix

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
        session: {
          bucket,
          prefix: rootPrefix,
          canWrite: providerUserSession.write,
          supportsMoveFolder: this.supportsMoveFolder,
        },
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
      const { bucket, client } = this.session(companion, providerUserSession, {
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
    if (!key.startsWith(prefix) || hasUnsafeSegment(key)) {
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
      const { bucket, client } = this.session(companion, providerUserSession, {
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
   * Moves or renames one item. Plain S3 moves files only (a folder is a key
   * prefix, so the client walks it and moves its files one by one); a backend
   * that `supportsMoveFolder` gets folders too, with a normalised target.
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
  }): Promise<ItemRef> {
    return this.withErrorHandling('provider.s3.move.error', async () => {
      const session = this.session(companion, providerUserSession, {
        requireWrite: true,
        keys: [id, destination],
      })
      const isFolder = id.endsWith('/')
      if (isFolder && !this.supportsMoveFolder) {
        throw new ProviderUserError({ message: 's3FolderMoveNotSupported' })
      }
      if (!isFolder && destination.endsWith('/')) {
        throw new ProviderUserError({ message: 's3DestinationMustBeFile' })
      }
      const target = isFolder ? ensureTrailingSlash(destination) : destination
      if (isFolder && target.startsWith(id)) {
        throw new ProviderUserError({ message: 's3FolderIntoItself' })
      }
      if (target === id) return itemRef(id)
      return this.move(session, id, target)
    })
  }

  /**
   * Moves one object: copy, then delete the source. Re-running an interrupted
   * move works: a destination that already holds the same object only needs
   * the source deleted.
   */
  protected async move(
    { bucket, client, config: { writeParams } }: S3Session<P>,
    id: string,
    destination: string,
  ): Promise<ItemRef> {
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
    return itemRef(destination)
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
  }): Promise<ItemRef> {
    return this.withErrorHandling(
      'provider.s3.createFolder.error',
      async () => {
        const parentFolder = parentId
          ? ensureTrailingSlash(parentId)
          : undefined
        const {
          bucket,
          prefix,
          client,
          config: { writeParams },
        } = this.session(companion, providerUserSession, {
          requireWrite: true,
          keys: parentFolder ? [parentFolder] : [],
        })
        const cleanName = name.trim().replace(/^\/+|\/+$/g, '')
        if (
          cleanName.length === 0 ||
          cleanName.includes('/') ||
          hasUnsafeSegment(cleanName)
        ) {
          throw new ProviderUserError({ message: 's3InvalidName' })
        }
        const key = `${parentFolder ?? prefix}${cleanName}/`
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
        return itemRef(key)
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
   * Companion's own errors pass through. A misconfiguration and S3's "not
   * found" are the user's business (the details of the former are in the
   * log). Everything else (permissions, wrong endpoint, throttling) is
   * reported to the browser generically — the original goes to Companion's
   * log, which `withErrorHandling` takes care of.
   */
  protected override mapProviderError(err: unknown): unknown {
    if (err instanceof ProviderApiError) return err
    if (err instanceof S3ConfigError) {
      return new ProviderUserError({ message: 's3NotConfigured' })
    }
    if (isNotFound(err)) return new ProviderUserError({ message: 's3NotFound' })
    if (isPreconditionFailed(err)) {
      return new ProviderUserError({ message: 's3Conflict' })
    }
    return new ProviderUserError({ message: 's3RequestFailed' })
  }
}
