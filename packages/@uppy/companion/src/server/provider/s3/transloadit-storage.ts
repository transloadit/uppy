import { createHmac } from 'node:crypto'
import got, { type OptionsInit, type Response } from 'got'
import { z } from 'zod'
import type { S3ClientOptions } from '../../../schemas/companion.js'
import logger from '../../logger.js'
import { ProviderApiError } from '../error.js'
import { userError } from '../errorCodes.js'
import {
  type ParsedTransloaditStorageOptions,
  parseTransloaditStorageProviderOptions,
  S3ConfigError,
} from './config.js'
import S3Provider, {
  type ItemRef,
  itemRef,
  type ResolvedConfig,
  type S3Session,
  withOwnCredentials,
} from './index.js'

const moveResponseSchema = z.object({
  ok: z.literal('DAM_ENTRY_MOVED'),
  path: z.string().min(1),
})

type Credentials = { key: string; secret: string }

const unavailable = () =>
  new ProviderApiError('Storage is temporarily unavailable', 502)

/**
 * One POST to Transloadit's API: a single attempt, no redirects, JSON back and
 * HTTP errors left to the caller. A transport failure reads as an outage, and
 * the got error is not logged: its request options carry the signature.
 */
const callApi = async (
  apiEndpoint: string,
  path: string,
  options: Pick<OptionsInit, 'json' | 'form' | 'headers' | 'timeout'>,
): Promise<Response<unknown>> => {
  try {
    return await got.post<unknown>(new URL(path, apiEndpoint), {
      ...options,
      retry: { limit: 0 },
      followRedirect: false,
      throwHttpErrors: false,
      responseType: 'json',
    })
  } catch {
    throw unavailable()
  }
}

/** A Workspace's key pair from the static `workspaces` map. */
const staticCredentials = (
  workspaces: Record<string, Credentials>,
  workspace: string,
): Credentials => {
  const credentials = Object.hasOwn(workspaces, workspace)
    ? workspaces[workspace]
    : undefined
  if (credentials == null) {
    throw new S3ConfigError(
      `No credentials for Workspace "${workspace}" under providerOptions['transloadit-storage'].workspaces`,
    )
  }
  return credentials
}

/** A Workspace's key pair from API2's credential resolver. */
const fetchCredentials = async (
  apiEndpoint: string,
  credentialsSecret: string,
  workspace: string,
): Promise<Credentials> => {
  if (!/^[a-f0-9]{32}$/.test(workspace)) throw userError('S3_INVALID_GRANT')
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac('sha256', credentialsSecret)
    .update(`file-library-credentials:v1:${timestamp}:${workspace}`)
    .digest('hex')
  // The endpoint is operator configuration, never a URL from the session or browser.
  const response = await callApi(
    apiEndpoint,
    '/internal/file-library/credentials',
    {
      json: { workspace },
      headers: { authorization: `FileLibrary ${timestamp}:${signature}` },
      timeout: { request: 5000 },
    },
  )
  if (response.statusCode === 403) throw userError('S3_REQUEST_FAILED')
  if (response.statusCode === 401) {
    // API2 rejected Companion's own proof: a `credentialsSecret` mismatch or clock skew
    // beyond its 30-second window. The user still sees an outage; operators need the cause.
    logger.warn(
      'native Storage credential resolver rejected the server proof: check credentialsSecret and clock sync',
      'provider.transloadit-storage.credentials',
    )
    throw unavailable()
  }
  const credentials = z
    .object({
      workspace: z.literal(workspace),
      authKey: z.string().min(1).max(256),
      authSecret: z.string().min(1).max(1024),
    })
    .safeParse(response.body)
  if (response.statusCode !== 200 || !credentials.success) throw unavailable()
  return { key: credentials.data.authKey, secret: credentials.data.authSecret }
}

/**
 * Transloadit Storage: the S3 provider on Storage's S3-compatible endpoint,
 * with native catalog moves and one key pair per Workspace (a grant names the
 * Workspace as its bucket). Configured under
 * `providerOptions['transloadit-storage']`.
 *
 * @experimental Part of the file-management provider API (S3, Transloadit
 * Storage): options, endpoints and methods will change incompatibly, also
 * in minor releases.
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
  protected override clientOptionsFor(
    config: ResolvedConfig<ParsedTransloaditStorageOptions>,
    bucket: string,
  ): { cacheKey: string; clientOptions: S3ClientOptions } {
    const { apiEndpoint, credentialsSecret } = config.native
    if (credentialsSecret != null) {
      const ownOptions = withOwnCredentials(config.clientOptions)
      return {
        cacheKey: bucket,
        clientOptions: {
          ...ownOptions,
          awsClientOptions: {
            ...ownOptions.awsClientOptions,
            credentials: async () => {
              const { key, secret } = await fetchCredentials(
                apiEndpoint,
                credentialsSecret,
                bucket,
              )
              return {
                accessKeyId: key,
                secretAccessKey: secret,
                // Stay beyond the SDK's five-minute refresh window. API2 still checks live
                // Workspace admission on every S3 request, independently of these credentials.
                expiration: new Date(Date.now() + 10 * 60_000),
              }
            },
          },
        },
      }
    }
    const { key, secret } = staticCredentials(config.native.workspaces, bucket)
    return {
      cacheKey: bucket,
      clientOptions: withOwnCredentials({
        ...config.clientOptions,
        key,
        secret,
      }),
    }
  }

  /**
   * One signed call to Transloadit's catalog moves a file or a whole folder
   * and keeps asset identity; it never falls back to S3 copy/delete.
   */
  protected override async move(
    { client, config: { native } }: S3Session<ParsedTransloaditStorageOptions>,
    id: string,
    destination: string,
  ): Promise<ItemRef> {
    // Sign with the Workspace key pair the session's S3 client uses: in dynamic
    // mode the SDK has it cached, so a move costs no extra resolver call.
    const { accessKeyId: key, secretAccessKey: secret } =
      await client.config.credentials()
    const params = JSON.stringify({
      auth: { key, expires: new Date(Date.now() + 60_000).toISOString() },
      source: id,
      destination,
    })
    const signature = `sha256:${createHmac('sha256', secret).update(params, 'utf8').digest('hex')}`
    const response = await callApi(native.apiEndpoint, '/dam/entries/move', {
      form: { params, signature },
      timeout: { request: 30_000 },
    })
    if (response.statusCode >= 500) throw unavailable()
    if (response.statusCode !== 200) {
      logger.warn(
        `native Storage move refused: ${response.statusCode}`,
        'provider.transloadit-storage.move',
      )
      throw userError('S3_REQUEST_FAILED')
    }
    const moved = moveResponseSchema.safeParse(response.body)
    if (!moved.success || moved.data.path !== destination) {
      throw new ProviderApiError('Unexpected native Storage move response', 502)
    }
    return itemRef(destination)
  }
}
