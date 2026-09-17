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
import type { S3ProviderOptions } from '../../../schemas/companion.js'
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
import {
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

/** Object attributes Companion sets when it writes (copies, folder markers). */
type WriteParams = Pick<S3ProviderOptions, 'acl' | 'awsSse' | 'awsSseKmsKeyId'>

type ResolvedConfig =
  | {
      mode: 'grant'
      keys: GrantKeys
      clientOptions: Pick<CompanionRuntimeOptions, 's3'>
      write: WriteParams
    }
  | {
      mode: 'bucket'
      bucket: string
      prefix: string
      clientOptions: Pick<CompanionRuntimeOptions, 's3'>
      write: WriteParams
    }

const ensureTrailingSlash = (s: string): string =>
  s.length === 0 || s.endsWith('/') ? s : `${s}/`

/** `CopyObject` refuses sources above this size; larger objects need a multipart copy. */
const MAX_COPY_BYTES = 5 * 1024 ** 3

const isNotFound = (err: unknown): boolean =>
  err instanceof NotFound ||
  err instanceof NoSuchKey ||
  (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404)

const iconForKey = (key: string): string => {
  const mime = mimeLookup(key)
  if (typeof mime === 'string' && mime.startsWith('video/')) return 'video'
  return 'file'
}

/**
 * Something the operator has to fix. The details go to Companion's log; the
 * browser only gets a generic, translatable message.
 */
const operatorError = (details: string): ProviderUserError => {
  logger.error(details, 'provider.s3.config')
  return new ProviderUserError({ message: 's3NotConfigured' })
}

/**
 * Adapter for browsing and managing S3-compatible object storage (AWS S3,
 * Cloudflare R2, MinIO, Transloadit Storage, ...). Configured under
 * `providerOptions.s3`; credentials left unset there fall back to the `s3`
 * upload block. Bucket-level permissions are the job of IAM / bucket policies
 * on those credentials: Companion only enforces the per-user prefix and write
 * flag carried by grants.
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
      providerUserSession.bucket.length > 0 &&
      typeof providerUserSession.prefix === 'string' &&
      typeof providerUserSession.write === 'boolean'
    )
  }

  /** Overridable for tests. */
  getClient(clientOptions: Pick<CompanionRuntimeOptions, 's3'>): S3Client {
    const client = getS3Client(clientOptions)
    if (client == null) {
      throw operatorError(
        'The S3 provider has no region: set `providerOptions.s3.region` (or `s3.region`)',
      )
    }
    return client
  }

  #config(companion: CompanionLike): ResolvedConfig {
    const upload = companion.options.s3
    const own: S3ProviderOptions | undefined =
      companion.options.providerOptions?.['s3']
    if (own == null || typeof own !== 'object') {
      throw operatorError(
        'The S3 provider is not configured: set `providerOptions.s3` (see S3ProviderOptions)',
      )
    }
    // The provider's own settings win; anything unset comes from the upload block.
    const s3 = {
      ...upload,
      expires: upload?.expires ?? 0,
      // Browsing goes to the plain endpoint; transfer acceleration is an upload concern.
      useAccelerateEndpoint: false,
      ...(own.key != null && { key: own.key }),
      ...(own.secret != null && { secret: own.secret }),
      ...(own.sessionToken != null && { sessionToken: own.sessionToken }),
      ...(own.region != null && { region: own.region }),
      ...(own.endpoint != null && { endpoint: own.endpoint }),
      ...(own.forcePathStyle != null && { forcePathStyle: own.forcePathStyle }),
      ...(own.awsClientOptions != null && {
        awsClientOptions: own.awsClientOptions,
      }),
    } as NonNullable<CompanionRuntimeOptions['s3']>
    const clientOptions: Pick<CompanionRuntimeOptions, 's3'> = { s3 }
    const write: WriteParams = {
      acl: own.acl ?? upload?.acl,
      awsSse: own.awsSse ?? upload?.awsSse,
      awsSseKmsKeyId: own.awsSseKmsKeyId ?? upload?.awsSseKmsKeyId,
    }
    const keys: GrantKeys = {
      secrets: own.grantSecret,
      publicKeys: own.grantPublicKey,
    }
    if (hasGrantKeys(keys)) {
      return { mode: 'grant', keys, clientOptions, write }
    }
    if (typeof own.bucket === 'string' && own.bucket.length > 0) {
      return {
        mode: 'bucket',
        bucket: own.bucket,
        prefix: normalizeStorageGrantPrefix(own.prefix ?? ''),
        clientOptions,
        write,
      }
    }
    throw operatorError(
      'The S3 provider needs either `providerOptions.s3.bucket` or a grant key (`grantSecret` / `grantPublicKey`)',
    )
  }

  /**
   * Every operation starts here: a session that matches the current
   * configuration, write access when `mutate`, and every key inside the
   * session's prefix.
   */
  #session(
    companion: CompanionLike,
    providerUserSession: S3UserSession,
    { mutate = false, keys = [] as string[] } = {},
  ): { bucket: string; prefix: string; client: S3Client; write: WriteParams } {
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
    if (mutate && !write) {
      // A user error, not an auth error: a fresh session would not help.
      throw new ProviderUserError({ message: 's3ReadOnlySession' })
    }
    for (const key of keys) this.#assertInsidePrefix(prefix, key)
    return {
      bucket,
      prefix,
      client: this.getClient(config.clientOptions),
      write: config.write,
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
    companion?: CompanionLike | undefined
  }): Promise<S3UserSession> {
    if (companion == null) throw new Error('companion is required')
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
        exp: claims.exp,
      }
    } catch (err) {
      // Expired grants are an auth error so the client asks for a new one.
      if (err instanceof GrantExpiredError) throw new ProviderAuthError()
      logger.debug(
        err instanceof Error ? err.message : String(err),
        'provider.s3.grant.invalid',
      )
      throw new ProviderUserError({ message: 's3InvalidGrant' })
    }
  }

  /** Grant sessions expire with their grant; bucket sessions use the default. */
  override simpleAuthTokenMaxAge(providerUserSession: S3UserSession): number {
    const { exp } = providerUserSession
    if (exp == null) return super.simpleAuthTokenMaxAge(providerUserSession)
    return Math.max(0, exp - Math.floor(Date.now() / 1000))
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
    if (!key.startsWith(prefix)) {
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

  #writeParams({ acl, awsSse, awsSseKmsKeyId }: WriteParams) {
    return {
      ...(acl != null && { ACL: acl }),
      ...(awsSse != null && { ServerSideEncryption: awsSse }),
      ...(awsSseKmsKeyId != null && { SSEKMSKeyId: awsSseKmsKeyId }),
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
      const { bucket, client, write } = this.#session(
        companion,
        providerUserSession,
        { mutate: true, keys: [id, destination] },
      )
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

      const source = await this.#head(client, bucket, id)
      if (source == null) {
        throw new ProviderUserError({ message: 's3NotFound' })
      }
      if ((source.ContentLength ?? 0) > MAX_COPY_BYTES) {
        throw new ProviderUserError({ message: 's3FileTooLargeToMove' })
      }
      const existing = await this.#head(client, bucket, destination)
      if (existing != null) {
        // Same size and ETag: the copy already happened (an earlier attempt
        // stopped before deleting the source). Anything else is a conflict.
        // (Under SSE-KMS a copy gets a new ETag, so a resumed move of such an
        // object reports a conflict rather than deleting the source.)
        const sameObject =
          existing.ContentLength === source.ContentLength &&
          existing.ETag != null &&
          existing.ETag === source.ETag
        if (!sameObject) {
          throw new ProviderUserError({ message: 's3AlreadyExists' })
        }
      } else {
        await client.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `/${bucket}/${id.split('/').map(encodeURIComponent).join('/')}`,
            Key: destination,
            ...this.#writeParams(write),
          }),
        )
      }
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: id }))
      return result
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
        const { bucket, prefix, client, write } = this.#session(
          companion,
          providerUserSession,
          {
            mutate: true,
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
        if (
          (await this.#folderHasEntries(client, bucket, key)) ||
          (await this.#head(client, bucket, key)) != null
        ) {
          throw new ProviderUserError({ message: 's3AlreadyExists' })
        }
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: '',
            ...this.#writeParams(write),
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
   * is logged for the operator and reported to the browser generically.
   */
  protected override mapProviderError(err: unknown): unknown {
    if (err instanceof ProviderApiError) return err
    if (isNotFound(err)) return new ProviderUserError({ message: 's3NotFound' })
    logger.error(
      err instanceof Error ? err : new Error(String(err)),
      'provider.s3.error',
    )
    return new ProviderUserError({ message: 's3RequestFailed' })
  }
}
