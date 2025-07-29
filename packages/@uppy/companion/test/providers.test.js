import nock from 'nock'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import * as tokenService from '../src/server/helpers/jwt.js'
import * as providerModule from '../src/server/provider/index.js'
import * as defaults from './fixtures/constants.js'
import { nockGoogleDownloadFile } from './fixtures/drive.js'
import * as fixtures from './fixtures/index.js'
import {
  nockZoomRecordings,
  nockZoomRevoke,
  expects as zoomExpects,
} from './fixtures/zoom.js'
import mockOauthState from './mockoauthstate.js'
import { getServer } from './mockserver.js'

const { localZoomKey, localZoomSecret } = zoomExpects

vi.mock('express-prom-bundle')
vi.mock('tus-js-client')

mockOauthState()

vi.mock('../../src/server/helpers/request.js', () => {
  return {
    getURLMeta: () => Promise.resolve({ size: 758051 }),
  }
})

const getServerWithEnv = async () =>
  getServer({ COMPANION_CLIENT_SOCKET_CONNECT_TIMEOUT: '0' })
const OAUTH_STATE = 'some-cool-nice-encrytpion'

const secret = 'secret'

const providers = providerModule.getDefaultProviders()

const providerNames = Object.keys(providers)
const oauthProviders = Object.fromEntries(
  Object.entries(providers).flatMap(([name, provider]) =>
    provider.oauthProvider != null ? [[name, provider.oauthProvider]] : [],
  ),
)
const authData = {}
providerNames.forEach((provider) => {
  authData[provider] = { accessToken: 'token value' }
})
const token = tokenService.generateEncryptedAuthToken(authData, secret)

const thisOrThat = (value1, value2) => {
  if (value1 !== undefined) {
    return value1
  }

  return value2
}

function nockGetCurrentAccount(times = 1) {
  nock('https://api.dropboxapi.com')
    .post('/2/users/get_current_account')
    .times(times)
    .reply(200, {
      name: {
        given_name: 'Franz',
        surname: 'Ferdinand',
        familiar_name: 'Franz',
        display_name: 'Franz Ferdinand (Personal)',
        abbreviated_name: 'FF',
      },
      email: defaults.USERNAME,
      email_verified: true,
      disabled: false,
      locale: 'en',
      referral_link: 'https://db.tt/ZITNuhtI',
      is_paired: true,
    })
}

beforeAll(() => {
  const url = new URL(defaults.THUMBNAIL_URL)
  nock(url.origin)
    .get(url.pathname)
    .reply(200, () => '')
    .persist()
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('list provider files', () => {
  async function runTest(providerName) {
    const providerFixture = fixtures.providers[providerName]?.expects ?? {}
    return request(await getServerWithEnv())
      .get(`/${providerName}/list/${providerFixture.listPath || ''}`)
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => {
        expect(res.header['i-am']).toBe('http://localhost:3020')

        return {
          username: res.body.username,
          items: res.body.items,
          providerFixture,
        }
      })
  }

  function expect1({ username, items, providerFixture }) {
    expect(username).toBe(defaults.USERNAME)

    const item = items[0]
    expect(item.isFolder).toBe(false)
    expect(item.name).toBe(providerFixture.itemName || defaults.ITEM_NAME)
    expect(item.mimeType).toBe(
      providerFixture.itemMimeType || defaults.MIME_TYPE,
    )
    expect(item.id).toBe(providerFixture.itemId || defaults.ITEM_ID)
    expect(item.size).toBe(
      thisOrThat(providerFixture.itemSize, defaults.FILE_SIZE),
    )
    expect(item.requestPath).toBe(
      providerFixture.itemRequestPath || defaults.ITEM_ID,
    )
    expect(item.icon).toBe(providerFixture.itemIcon || defaults.THUMBNAIL_URL)
  }

  test('dropbox', async () => {
    nockGetCurrentAccount()
    nock('https://api.dropboxapi.com')
      .post('/2/files/list_folder')
      .reply(200, {
        entries: [
          {
            '.tag': 'file',
            name: defaults.ITEM_NAME,
            id: defaults.ITEM_ID,
            client_modified: '2015-05-12T15:50:38Z',
            server_modified: '2015-05-12T15:50:38Z',
            rev: 'a1c10ce0dd78',
            size: defaults.FILE_SIZE,
            path_lower: '/homework/math/prime_numbers.txt',
            path_display: '/Homework/math/Prime_Numbers.txt',
            is_downloadable: true,
            has_explicit_shared_members: false,
            content_hash: 'e3b0c44298fc1c149afbf41e4649b934ca49',
            file_lock_info: {
              is_lockholder: true,
              lockholder_name: 'Imaginary User',
              created: '2015-05-12T15:50:38Z',
            },
          },
        ],
        cursor: 'ZtkX9_EHj3x7PMkVuFIhwKYXEpwpLwyxp9vMKomUhllil9q7eWiAu',
        has_more: false,
      })

    const { username, items, providerFixture } = await runTest('dropbox')
    expect1({ username, items, providerFixture })
  })

  test('box', async () => {
    nock('https://api.box.com').get('/2.0/users/me').reply(200, {
      login: defaults.USERNAME,
    })
    nock('https://api.box.com')
      .get(
        '/2.0/folders/0/items?fields=id%2Cmodified_at%2Cname%2Cpermissions%2Csize%2Ctype&limit=1000',
      )
      .reply(200, {
        entries: [
          {
            type: 'file',
            name: defaults.ITEM_NAME,
            id: defaults.ITEM_ID,
            modified_at: '2015-05-12T15:50:38Z',
            size: defaults.FILE_SIZE,
          },
        ],
      })

    const { username, items, providerFixture } = await runTest('box')
    expect1({ username, items, providerFixture })
  })

  test('drive', async () => {
    nock('https://www.googleapis.com')
      .get('/drive/v3/drives?fields=*&pageToken=&pageSize=100')
      .reply(200, {
        kind: 'drive#driveList',
        drives: [],
      })

    nock('https://www.googleapis.com')
      .get(
        '/drive/v3/files?fields=kind%2CnextPageToken%2CincompleteSearch%2Cfiles%28kind%2Cid%2CimageMediaMetadata%2Cname%2CmimeType%2CownedByMe%2Csize%2CmodifiedTime%2CiconLink%2CthumbnailLink%2CteamDriveId%2CvideoMediaMetadata%2CexportLinks%2CshortcutDetails%28targetId%2CtargetMimeType%29%29&q=%28%27root%27+in+parents%29+and+trashed%3Dfalse&pageSize=1000&orderBy=folder%2Cname&includeItemsFromAllDrives=true&supportsAllDrives=true',
      )
      .reply(200, {
        kind: 'drive#fileList',
        nextPageToken: defaults.NEXT_PAGE_TOKEN,
        files: [
          {
            kind: 'drive#file',
            id: defaults.ITEM_ID,
            name: defaults.ITEM_NAME,
            mimeType: defaults.MIME_TYPE,
            iconLink:
              'https://drive-thirdparty.googleusercontent.com/16/type/video/mp4',
            thumbnailLink: defaults.THUMBNAIL_URL,
            modifiedTime: '2016-07-10T20:00:08.096Z',
            ownedByMe: true,
            permissions: [{ role: 'owner', emailAddress: defaults.USERNAME }],
            size: '758051',
          },
        ],
      })

    nock('https://www.googleapis.com')
      .get((uri) => uri.includes('about'))
      .reply(200, { user: { emailAddress: 'john.doe@transloadit.com' } })

    const { username, items, providerFixture } = await runTest('drive')

    // Drive has a virtual "shared-with-me" folder as the first item
    const [item0, ...rest] = items
    expect(item0.isFolder).toBe(true)
    expect(item0.name).toBe('Shared with me')
    expect(item0.mimeType).toBe('application/vnd.google-apps.folder')
    expect(item0.id).toBe('shared-with-me')
    expect(item0.requestPath).toBe('shared-with-me')
    expect(item0.icon).toBe('folder')

    expect1({ username, items: rest, providerFixture })
  })

  test('facebook', async () => {
    nock('https://graph.facebook.com')
      .post(
        '/',
        [
          'access_token=token+value',
          'appsecret_proof=ee28d8152093b877f193f5fe84a34544ec27160e7f34c7645d02930b3fa95160',
          `batch=${encodeURIComponent('[{"method":"GET","relative_url":"me?fields=email"},{"method":"GET","relative_url":"ALBUM-ID/photos?fields=icon%2Cimages%2Cname%2Cwidth%2Cheight%2Ccreated_time"}]')}`,
        ].join('&'),
      )
      .reply(200, [
        {
          code: 200,
          body: JSON.stringify({
            name: 'Fiona Fox',
            birthday: '01/01/1985',
            email: defaults.USERNAME,
          }),
        },
        {
          code: 200,
          body: JSON.stringify({
            data: [
              {
                images: [
                  {
                    height: 1365,
                    source: defaults.THUMBNAIL_URL,
                    width: 2048,
                  },
                ],
                width: 720,
                height: 479,
                created_time: '2015-07-17T17:26:50+0000',
                id: defaults.ITEM_ID,
              },
            ],
            paging: {},
          }),
        },
      ])

    const { username, items, providerFixture } = await runTest('facebook')
    expect1({ username, items, providerFixture })
  })

  test('instagram', async () => {
    nock('https://graph.instagram.com').get('/me?fields=username').reply(200, {
      id: '17841405793187218',
      username: defaults.USERNAME,
    })
    nock('https://graph.instagram.com')
      .get(
        '/me/media?fields=id%2Cmedia_type%2Cthumbnail_url%2Cmedia_url%2Ctimestamp%2Cchildren%7Bmedia_type%2Cmedia_url%2Cthumbnail_url%2Ctimestamp%7D',
      )
      .reply(200, {
        data: [
          {
            id: defaults.ITEM_ID,
            media_type: 'IMAGE',
            timestamp: '2017-08-31T18:10:00+0000',
            media_url: defaults.THUMBNAIL_URL,
          },
        ],
      })

    const { username, items, providerFixture } = await runTest('instagram')
    expect1({ username, items, providerFixture })
  })

  test('onedrive', async () => {
    nock('https://graph.microsoft.com').get('/v1.0/me').reply(200, {
      userPrincipalName: defaults.USERNAME,
      mail: defaults.USERNAME,
    })
    nock('https://graph.microsoft.com')
      .get('/v1.0/me/drive/root/children?%24expand=thumbnails&%24top=999')
      .reply(200, {
        value: [
          {
            createdDateTime: '2020-01-31T15:40:26.197Z',
            id: defaults.ITEM_ID,
            lastModifiedDateTime: '2020-01-31T15:40:38.723Z',
            name: defaults.ITEM_NAME,
            size: defaults.FILE_SIZE,
            parentReference: {
              driveId: 'DUMMY-DRIVE-ID',
              driveType: 'personal',
              path: '/drive/root:',
            },
            file: {
              mimeType: defaults.MIME_TYPE,
            },
            thumbnails: [
              {
                id: '0',
                large: {
                  height: 452,
                  url: defaults.THUMBNAIL_URL,
                  width: 800,
                },
                medium: {
                  height: 100,
                  url: defaults.THUMBNAIL_URL,
                  width: 176,
                },
                small: {
                  height: 54,
                  url: defaults.THUMBNAIL_URL,
                  width: 96,
                },
              },
            ],
          },
        ],
      })

    const { username, items, providerFixture } = await runTest('onedrive')
    expect1({ username, items, providerFixture })
  })

  test('zoom', async () => {
    nock('https://zoom.us').get('/v2/users/me').reply(200, {
      id: 'DUMMY-USER-ID',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@transloadit.com',
      timezone: '',
      dept: '',
      created_at: '2020-07-21T09:13:30Z',
      last_login_time: '2020-10-12T07:55:02Z',
      group_ids: [],
      im_group_ids: [],
      account_id: 'DUMMY-ACCOUNT-ID',
      language: 'en-US',
    })
    nockZoomRecordings()

    const { username, items, providerFixture } = await runTest('zoom')
    expect1({ username, items, providerFixture })
  })
})

describe('provider file gets downloaded from', () => {
  async function runTest(providerName) {
    const providerFixture = fixtures.providers[providerName]?.expects ?? {}
    const res = await request(await getServerWithEnv())
      .post(
        `/${providerName}/get/${providerFixture.itemRequestPath || defaults.ITEM_ID}`,
      )
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://tusd.tusdemo.net/files',
        protocol: 'tus',
      })
      .expect(200)

    expect(res.body.token).toBeTruthy()
  }

  test('dropbox', async () => {
    nockGetCurrentAccount(2)
    nock('https://api.dropboxapi.com')
      .post('/2/files/get_metadata')
      .reply(200, { size: defaults.FILE_SIZE })
    nock('https://content.dropboxapi.com')
      .post('/2/files/download')
      .reply(200, {})
    await runTest('dropbox')
  })

  test('box', async () => {
    nock('https://api.box.com')
      .get(`/2.0/files/${defaults.ITEM_ID}`)
      .reply(200, { size: defaults.FILE_SIZE })
    nock('https://api.box.com')
      .get(`/2.0/files/${defaults.ITEM_ID}/content`)
      .reply(200, { size: defaults.FILE_SIZE })
    await runTest('box')
  })

  test('drive', async () => {
    nockGoogleDownloadFile()
    await runTest('drive')
  })

  test('facebook', async () => {
    // times(2) because of size request
    nock('https://graph.facebook.com')
      .post(
        '/',
        [
          'access_token=token+value',
          'appsecret_proof=ee28d8152093b877f193f5fe84a34544ec27160e7f34c7645d02930b3fa95160',
          `batch=${encodeURIComponent('[{"method":"GET","relative_url":"DUMMY-FILE-ID?fields=images"}]')}`,
        ].join('&'),
      )
      .times(2)
      .reply(200, [
        {
          code: 200,
          body: JSON.stringify({
            images: [
              {
                height: 1365,
                source: defaults.THUMBNAIL_URL,
                width: 2048,
              },
            ],
            id: defaults.ITEM_ID,
          }),
        },
      ])

    await runTest('facebook')
  })

  test('instagram', async () => {
    // times(2) because of size request
    nock('https://graph.instagram.com')
      .get(`/${defaults.ITEM_ID}?fields=media_url`)
      .times(2)
      .reply(200, {
        id: defaults.ITEM_ID,
        media_type: 'IMAGE',
        media_url: defaults.THUMBNAIL_URL,
        timestamp: '2017-08-31T18:10:00+0000',
      })
    await runTest('instagram')
  })

  test('onedrive', async () => {
    nock('https://graph.microsoft.com')
      .get(`/v1.0/drives/DUMMY-DRIVE-ID/items/${defaults.ITEM_ID}`)
      .reply(200, {
        size: defaults.FILE_SIZE,
      })
    nock('https://graph.microsoft.com')
      .get(`/v1.0/drives/DUMMY-DRIVE-ID/items/${defaults.ITEM_ID}/content`)
      .reply(200, {})
    await runTest('onedrive')
  })

  test('zoom', async () => {
    // times(2) because of size request
    nockZoomRecordings({ times: 2 })
    nock('https://us02web.zoom.us')
      .get('/rec/download/DUMMY-DOWNLOAD-PATH?access_token=token%20value')
      .reply(200, {})
    await runTest('zoom')
  })
})

describe('connect to provider', () => {
  test.each(providerNames)(
    'connect to %s via grant.js endpoint',
    async (providerName) => {
      const oauthProvider = oauthProviders[providerName]

      if (oauthProvider == null) return

      await request(await getServerWithEnv())
        .get(`/${providerName}/connect?foo=bar`)
        .set('uppy-auth-token', token)
        .expect(302)
        .expect(
          'Location',
          `http://localhost:3020/connect/${oauthProvider}?state=${OAUTH_STATE}`,
        )
    },
  )
})

describe('logout of provider', () => {
  async function runTest(providerName) {
    const res = await request(await getServerWithEnv())
      .get(`/${providerName}/logout/`)
      .set('uppy-auth-token', token)
      .expect(200)

    // only some providers can actually be revoked
    const expectRevoked = [
      'box',
      'dropbox',
      'drive',
      'facebook',
      'zoom',
    ].includes(providerName)

    expect(res.body).toMatchObject({
      ok: true,
      revoked: expectRevoked,
    })
  }

  test('dropbox', async () => {
    nockGetCurrentAccount(2)
    nock('https://api.dropboxapi.com')
      .post('/2/auth/token/revoke')
      .reply(200, {})
    await runTest('dropbox')
  })

  test('box', async () => {
    nock('https://api.box.com').post('/oauth2/revoke').reply(200, {})
    await runTest('box')
  })

  test('dropbox', async () => {
    nock('https://api.dropboxapi.com')
      .post('/2/auth/token/revoke')
      .reply(200, {})
    await runTest('dropbox')
  })

  test('drive', async () => {
    nock('https://accounts.google.com')
      .post('/o/oauth2/revoke?token=token+value')
      .reply(200, {})
    await runTest('drive')
  })

  test('facebook', async () => {
    // times(2) because of size request
    nock('https://graph.facebook.com')
      .post(
        '/',
        [
          'access_token=token+value',
          'appsecret_proof=ee28d8152093b877f193f5fe84a34544ec27160e7f34c7645d02930b3fa95160',
          `batch=${encodeURIComponent('[{"method":"DELETE","relative_url":"me/permissions"}]')}`,
        ].join('&'),
      )
      .reply(200, [
        {
          code: 200,
          body: JSON.stringify({}),
        },
      ])

    await runTest('facebook')
  })

  test('instagram', async () => {
    await runTest('instagram')
  })

  test('onedrive', async () => {
    await runTest('onedrive')
  })

  test('zoom', async () => {
    nockZoomRevoke({ key: localZoomKey, secret: localZoomSecret })
    await runTest('zoom')
  })
})
