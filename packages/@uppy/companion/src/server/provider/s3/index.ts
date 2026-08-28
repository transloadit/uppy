import type { Readable } from 'node:stream'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { lookup as mimeLookup } from 'mime-types'
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
 * Session for the S3 provider. Created via "simple auth" (non-OAuth):
 * the user (or the integrator, via a default) picks a bucket and an optional
 * prefix that scopes what they are allowed to browse. This is the hook for
 * multi-tenant DAM: e.g. `bucket: 'customer-assets', prefix: 'coursera/prof-123/'`.
 */
type S3UserSession = { bucket: string; prefix: string }

type CompanionS3Options = Pick<CompanionRuntimeOptions, 's3'>

const ensureTrailingSlash = (s: string): string =>
  s.length === 0 || s.endsWith('/') ? s : `${s}/`

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

  override async logout(): Promise<{ revoked: true }> {
    return { revoked: true }
  }

  override async simpleAuth({
    requestBody,
  }: {
    requestBody: unknown
  }): Promise<S3UserSession> {
    if (!isRecord(requestBody) || !isRecord(requestBody['form'])) {
      throw new ProviderUserError({ message: 'Invalid request body' })
    }
    const { form } = requestBody
    const bucketInput = typeof form['bucket'] === 'string' ? form['bucket'] : ''
    const parsed = parseBucketInput(bucketInput)
    if (parsed == null) {
      throw new ProviderUserError({
        message:
          'Please provide a bucket name (optionally followed by /prefix)',
      })
    }
    // Note: companion options are not available in simpleAuth, so the bucket
    // allowlist is enforced on list()/download() instead.
    return parsed
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
      if (!this.isAuthenticated({ providerUserSession })) {
        throw new ProviderAuthError()
      }
      const { bucket, prefix: rootPrefix } = providerUserSession
      this.assertBucketAllowed(companion.options, bucket)
      const client = this.getClient(companion.options)

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
      if (!this.isAuthenticated({ providerUserSession })) {
        throw new ProviderAuthError()
      }
      const { bucket, prefix } = providerUserSession
      this.assertBucketAllowed(companion.options, bucket)
      if (!id.startsWith(prefix)) throw new ProviderAuthError()
      const client = this.getClient(companion.options)
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
    if (!key.startsWith(prefix) || key.includes('../'))
      throw new ProviderAuthError()
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
      if (!this.isAuthenticated({ providerUserSession }))
        throw new ProviderAuthError()
      const { bucket, prefix } = providerUserSession
      this.assertBucketAllowed(companion.options, bucket)
      this.#assertInsidePrefix(prefix, id)
      const client = this.getClient(companion.options)
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
      if (!this.isAuthenticated({ providerUserSession }))
        throw new ProviderAuthError()
      const { bucket, prefix } = providerUserSession
      this.assertBucketAllowed(companion.options, bucket)
      this.#assertInsidePrefix(prefix, id)
      this.#assertInsidePrefix(prefix, destination)
      if (id.endsWith('/') || destination.endsWith('/')) {
        throw new ProviderUserError({ message: 'Folders cannot be moved yet' })
      }
      if (id === destination) return { id, requestPath: encodeURIComponent(id) }
      const client = this.getClient(companion.options)
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `/${bucket}/${id.split('/').map(encodeURIComponent).join('/')}`,
          Key: destination,
        }),
      )
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: id }))
      return { id: destination, requestPath: encodeURIComponent(destination) }
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
        if (!this.isAuthenticated({ providerUserSession }))
          throw new ProviderAuthError()
        const { bucket, prefix } = providerUserSession
        this.assertBucketAllowed(companion.options, bucket)
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
        const client = this.getClient(companion.options)
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

  async withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err: unknown) {
      let err2: unknown = err
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
        err2 = new ProviderUserError({
          message: `S3 error: ${String(name ?? status)}`,
        })
      } else if (status === 409 || status === 400) {
        err2 = new ProviderUserError({
          message: err instanceof Error ? err.message : `S3 error ${status}`,
        })
      } else if (status != null && !(err instanceof ProviderUserError)) {
        err2 = new ProviderApiError('S3 API error', status)
      }
      const errForLog = err2 instanceof Error ? err2 : new Error(String(err2))
      logger.error(errForLog, tag)
      throw err2
    }
  }
}
