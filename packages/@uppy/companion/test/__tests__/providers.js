/* global jest:false, test:false, expect:false, describe:false */

jest.mock('tus-js-client')
jest.mock('purest')
jest.mock('../../src/server/helpers/request', () => {
  return {
    getURLMeta: () => Promise.resolve({ size: 758051 }),
  }
})
jest.mock('../../src/server/helpers/oauth-state', () => require('../mockoauthstate')())

const request = require('supertest')
const nock = require('nock')

const fixtures = require('../fixtures')
const tokenService = require('../../src/server/helpers/jwt')
const { getServer } = require('../mockserver')
const defaults = require('../fixtures/constants')

// todo don't share server between tests. rewrite to not use env variables
const authServer = getServer({ COMPANION_CLIENT_SOCKET_CONNECT_TIMEOUT: '0' })
const OAUTH_STATE = 'some-cool-nice-encrytpion'
const providers = require('../../src/server/provider').getDefaultProviders()

const providerNames = Object.keys(providers)
// todo remove once all providers are ported
const newProviderNames = ['dropbox', 'box']
const AUTH_PROVIDERS = {
  drive: 'google',
  onedrive: 'microsoft',
}
const authData = {}
providerNames.forEach((provider) => {
  authData[provider] = 'token value'
})
const token = tokenService.generateEncryptedToken(authData, process.env.COMPANION_SECRET)

const thisOrThat = (value1, value2) => {
  if (value1 !== undefined) {
    return value1
  }

  return value2
}

beforeAll(() => {
  const url = new URL(defaults.THUMBNAIL_URL)
  nock(url.origin).get(url.pathname).reply(200, () => '').persist()
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('list provider files', () => {
  test.each(providerNames)('list files for %s', (providerName) => {
    if (newProviderNames.includes(providerName)) {
      nock('https://api.dropboxapi.com').post('/2/users/get_current_account').reply(200, () => ({
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
      }))
      nock('https://api.dropboxapi.com').post('/2/files/list_folder').reply(200, () => ({
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
      }))

      nock('https://api.box.com').get('/2.0/users/me').reply(200, () => ({
        login: defaults.USERNAME,
      }))
      nock('https://api.box.com').get('/2.0/folders/0/items?fields=id%2Cmodified_at%2Cname%2Cpermissions%2Csize%2Ctype').reply(200, () => ({
        entries: [
          {
            type: 'file',
            name: defaults.ITEM_NAME,
            id: defaults.ITEM_ID,
            modified_at: '2015-05-12T15:50:38Z',
            size: defaults.FILE_SIZE,
          },
        ],
      }))
    }

    const providerFixtures = fixtures.providers[providerName].expects
    return request(authServer)
      .get(`/${providerName}/list/${providerFixtures.listPath || ''}`)
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => {
        expect(res.header['i-am']).toBe('http://localhost:3020')
        expect(res.body.username).toBe(fixtures.defaults.USERNAME)

        const items = [...res.body.items]

        // Drive has a virtual "shared-with-me" folder as the first item
        if (providerName === 'drive') {
          const item0 = items.shift()
          expect(item0.isFolder).toBe(true)
          expect(item0.name).toBe('Shared with me')
          expect(item0.mimeType).toBe('application/vnd.google-apps.folder')
          expect(item0.id).toBe('shared-with-me')
          expect(item0.requestPath).toBe('shared-with-me')
          expect(item0.icon).toBe('folder')
        }

        const item = items[0]
        expect(item.isFolder).toBe(false)
        expect(item.name).toBe(providerFixtures.itemName || fixtures.defaults.ITEM_NAME)
        expect(item.mimeType).toBe(providerFixtures.itemMimeType || fixtures.defaults.MIME_TYPE)
        expect(item.id).toBe(providerFixtures.itemId || fixtures.defaults.ITEM_ID)
        expect(item.size).toBe(thisOrThat(providerFixtures.itemSize, fixtures.defaults.FILE_SIZE))
        expect(item.requestPath).toBe(providerFixtures.itemRequestPath || fixtures.defaults.ITEM_ID)
        expect(item.icon).toBe(providerFixtures.itemIcon || fixtures.defaults.THUMBNAIL_URL)
      })
  })
})

describe('download provider file', () => {
  test.each(providerNames)('specified file gets downloaded from %s', (providerName) => {
    if (newProviderNames.includes(providerName)) {
      nock('https://api.dropboxapi.com').post('/2/files/get_metadata').reply(200, () => ({ size: defaults.FILE_SIZE }))
      nock('https://content.dropboxapi.com').post('/2/files/download').reply(200, () => ({}))

      nock('https://api.box.com').get(`/2.0/files/${defaults.ITEM_ID}`).reply(200, () => ({ size: defaults.FILE_SIZE }))
      nock('https://api.box.com').get(`/2.0/files/${defaults.ITEM_ID}/content`).reply(200, () => ({ size: defaults.FILE_SIZE }))
    }

    const providerFixtures = fixtures.providers[providerName].expects
    return request(authServer)
      .post(`/${providerName}/get/${providerFixtures.itemRequestPath || fixtures.defaults.ITEM_ID}`)
      .set('uppy-auth-token', token)
      .set('Content-Type', 'application/json')
      .send({
        endpoint: 'http://tusd.tusdemo.net/files',
        protocol: 'tus',
      })
      .expect(200)
      .then((res) => expect(res.body.token).toBeTruthy())
  })
})

describe('connect to provider', () => {
  test.each(providerNames)('connect to %s via grant.js endpoint', (providerName) => {
    const authProvider = AUTH_PROVIDERS[providerName] || providerName

    return request(authServer)
      .get(`/${providerName}/connect?foo=bar`)
      .set('uppy-auth-token', token)
      .expect(302)
      .expect('Location', `http://localhost:3020/connect/${authProvider}?state=${OAUTH_STATE}`)
  })
})

describe('logout of provider', () => {
  test.each(providerNames)('logout of %s', (providerName) => {
    if (newProviderNames.includes(providerName)) {
      nock('https://api.dropboxapi.com').post('/2/auth/token/revoke').reply(200, () => ({}))
      nock('https://api.box.com').post('/oauth2/revoke').reply(200, () => ({}))
    }

    return request(authServer)
      .get(`/${providerName}/logout/`)
      .set('uppy-auth-token', token)
      .expect(200)
      .then((res) => expect(res.body.ok).toBe(true))
  })
})
