import got from 'got'
import { isRecord } from '../../helpers/type-guards.ts'
import { prepareStream } from '../../helpers/utils.ts'
import logger from '../../logger.ts'
import Provider from '../Provider.ts'
import { withProviderErrorHandling } from '../providerErrors.ts'
import adaptData from './adapter.ts'

type OneDriveClient = ReturnType<typeof got.extend>

const getClient = ({ token }: { token: string }): OneDriveClient =>
  got.extend({
    prefixUrl: 'https://graph.microsoft.com/v1.0',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

const getOauthClient = () =>
  got.extend({
    prefixUrl: 'https://login.live.com',
  })

function getQueryRecord(query: unknown): Record<string, string> {
  if (!isRecord(query)) return {}
  const out: Record<string, string> = {}
  const driveId = query.driveId
  if (typeof driveId === 'string' && driveId.length > 0) out.driveId = driveId
  const cursor = query.cursor
  if (typeof cursor === 'string' && cursor.length > 0) out.cursor = cursor
  return out
}

const getRootPath = (query: Record<string, string>): string =>
  query.driveId ? `drives/${query.driveId}` : 'me/drive'

/**
 * Adapter for API https://docs.microsoft.com/en-us/onedrive/developer/rest-api/
 */
export default class OneDrive extends Provider {
  static get oauthProvider() {
    return 'microsoft'
  }

  /**
   * Makes 2 requests in parallel - 1. to get files, 2. to get user email
   * it then waits till both requests are done before proceeding with the callback
   *
   * @param options
   * @param options.directory
   * @param options.query
   * @param options.providerUserSession
   */
  async list({
    directory,
    query,
    providerUserSession: { accessToken: token },
  }: {
    directory?: string
    query: unknown
    providerUserSession: { accessToken: string }
  }): Promise<unknown> {
    return this.#withErrorHandling('provider.onedrive.list.error', async () => {
      const queryRecord = getQueryRecord(query)
      const path = directory ? `items/${directory}` : 'root'
      // https://learn.microsoft.com/en-us/graph/query-parameters?tabs=http#top-parameter
      const pageSize = 999
      // const pageSize = 20 // to test pagination easily
      const qs = new URLSearchParams({
        $expand: 'thumbnails',
        $top: String(pageSize),
      })
      if (
        typeof queryRecord.cursor === 'string' &&
        queryRecord.cursor.length > 0
      ) {
        qs.set('$skiptoken', queryRecord.cursor)
      }

      const client = getClient({ token })

      const [me, list] = await Promise.all([
        client
          .get('me', { responseType: 'json' })
          .json<{ mail?: string; userPrincipalName?: string }>(),
        client
          .get(`${getRootPath(queryRecord)}/${path}/children`, {
            searchParams: qs,
            responseType: 'json',
          })
          .json<Parameters<typeof adaptData>[0]>(),
      ])

      const mail = typeof me.mail === 'string' ? me.mail : null
      const userPrincipalName =
        typeof me.userPrincipalName === 'string' ? me.userPrincipalName : null

      return adaptData(list, mail || userPrincipalName, queryRecord, directory)
    })
  }

  async download({
    id,
    providerUserSession: { accessToken: token },
    query,
  }: {
    id: string
    providerUserSession: { accessToken: string }
    query: unknown
  }): Promise<unknown> {
    return this.#withErrorHandling(
      'provider.onedrive.download.error',
      async () => {
        const queryRecord = getQueryRecord(query)
        const stream = getClient({ token }).stream.get(
          `${getRootPath(queryRecord)}/items/${id}/content`,
          { responseType: 'json' },
        )
        const { size } = await prepareStream(stream)
        return { stream, size }
      },
    )
  }

  async thumbnail() {
    // not implementing this because a public thumbnail from onedrive will be used instead
    logger.error(
      'call to thumbnail is not implemented',
      'provider.onedrive.thumbnail.error',
    )
    throw new Error('call to thumbnail is not implemented')
  }

  async size({
    id,
    query,
    providerUserSession: { accessToken: token },
  }: {
    id: string
    query: unknown
    providerUserSession: { accessToken: string }
  }): Promise<number | undefined> {
    return this.#withErrorHandling('provider.onedrive.size.error', async () => {
      const queryRecord = getQueryRecord(query)
      const body = await getClient({ token })
        .get(`${getRootPath(queryRecord)}/items/${id}`, {
          responseType: 'json',
        })
        .json<Record<string, unknown>>()
      const size = body.size
      return typeof size === 'number' ? size : undefined
    })
  }

  async logout() {
    // apparently M$ doesn't support programmatic oauth2 revoke
    return {
      revoked: false,
      manual_revoke_url: 'https://account.live.com/consent/Manage',
    }
  }

  async refreshToken({
    clientId,
    clientSecret,
    refreshToken,
    redirectUri,
  }: {
    clientId: string
    clientSecret: string
    refreshToken: string
    redirectUri: string
  }): Promise<{ accessToken: string }> {
    return this.#withErrorHandling(
      'provider.onedrive.token.refresh.error',
      async () => {
        const body = await getOauthClient()
          .post('oauth20_token.srf', {
            responseType: 'json',
            form: {
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
            },
          })
          .json<Record<string, unknown>>()

        const accessToken =
          typeof body.access_token === 'string' ? body.access_token : null
        if (!accessToken) {
          throw new Error('Unexpected OneDrive token refresh response')
        }
        return { accessToken }
      },
    )
  }

  async #withErrorHandling<T>(tag: string, fn: () => Promise<T>): Promise<T> {
    return withProviderErrorHandling({
      fn,
      tag,
      providerName: OneDrive.oauthProvider,
      isAuthError: (response: { statusCode?: number }) =>
        response.statusCode === 401,
      isUserFacingError: (response: { statusCode?: number }) =>
        typeof response.statusCode === 'number' &&
        [400, 403].includes(response.statusCode),
      // onedrive gives some errors here that the user might want to know about
      // e.g. these happen if you try to login to a users in an organization,
      // without an Office365 licence or OneDrive account setup completed
      // 400: Tenant does not have a SPO license
      // 403: You do not have access to create this personal site or you do not have a valid license
      getJsonErrorMessage: (body) => {
        if (!isRecord(body)) return undefined
        const err = body.error
        if (!isRecord(err)) return undefined
        return typeof err.message === 'string' ? err.message : undefined
      },
    })
  }
}
