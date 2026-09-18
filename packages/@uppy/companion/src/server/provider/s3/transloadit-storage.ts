import { createHmac } from 'node:crypto'
import got from 'got'
import { z } from 'zod'
import type { S3ClientOptions } from '../../../schemas/companion.js'
import logger from '../../logger.js'
import { ProviderApiError, ProviderUserError } from '../error.js'
import {
  type NativeStorage,
  type ParsedTransloaditStorageOptions,
  parseTransloaditStorageProviderOptions,
  S3ConfigError,
} from './config.js'
import S3Provider, {
  type ItemRef,
  type ResolvedConfig,
  type S3Session,
} from './index.js'

const moveResponseSchema = z.object({
  ok: z.literal('DAM_ENTRY_MOVED'),
  path: z.string().min(1),
})

/** The key pair Companion holds for a Workspace. */
const workspaceCredentials = (
  native: NativeStorage,
  workspace: string,
): { key: string; secret: string } => {
  const credentials = Object.hasOwn(native.workspaces, workspace)
    ? native.workspaces[workspace]
    : undefined
  if (credentials == null) {
    throw new S3ConfigError(
      `No credentials for Workspace "${workspace}" under providerOptions['transloadit-storage'].workspaces`,
    )
  }
  return credentials
}

/**
 * Transloadit Storage: the S3 provider on Storage's S3-compatible endpoint,
 * with native catalog moves and one key pair per Workspace (a grant names the
 * Workspace as its bucket). Configured under
 * `providerOptions['transloadit-storage']`.
 */
export default class TransloaditStorageProvider extends S3Provider<ParsedTransloaditStorageOptions> {
  protected override get optionsKey() {
    return 'transloadit-storage' as const
  }

  protected override parseOptions(own: unknown) {
    return parseTransloaditStorageProviderOptions(own)
  }

  protected override get supportsMoveFolder(): boolean {
    return true
  }

  /** One client per Workspace, signed with that Workspace's key pair. */
  protected override clientFor(
    config: ResolvedConfig<ParsedTransloaditStorageOptions>,
    bucket: string,
  ): { cacheKey: string; clientOptions: { s3: S3ClientOptions } } {
    const { key, secret } = workspaceCredentials(config.native, bucket)
    return {
      cacheKey: bucket,
      clientOptions: { s3: { ...config.clientOptions.s3, key, secret } },
    }
  }

  /**
   * One signed call to Transloadit's catalog moves a file or a whole folder
   * and keeps asset identity; it never falls back to S3 copy/delete.
   */
  protected override async move(
    { bucket: workspace, config }: S3Session<ParsedTransloaditStorageOptions>,
    id: string,
    destination: string,
  ): Promise<ItemRef> {
    const { native } = config
    const { key, secret } = workspaceCredentials(native, workspace)
    const params = JSON.stringify({
      auth: { key, expires: new Date(Date.now() + 60_000).toISOString() },
      source: id,
      destination,
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
        'provider.transloadit-storage.move',
      )
      throw new ProviderUserError({ message: 's3RequestFailed' })
    }
    const moved = moveResponseSchema.safeParse(response.body)
    if (!moved.success || moved.data.path !== destination) {
      throw new ProviderApiError('Unexpected native Storage move response', 502)
    }
    return { id: destination, requestPath: encodeURIComponent(destination) }
  }
}
