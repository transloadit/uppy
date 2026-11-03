import { network } from 'virtual:msw'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Dropbox from '@uppy/dropbox'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'

const COMPANION = 'http://companion.test'
const DISCOVERED_COMPANION = 'http://discovered-companion.test'
const LISTING = { username: 'test-user', items: [], nextPagePath: null }
const loginButton = () =>
  page.getByRole('button', { name: 'Connect to Dropbox' })

function initializeUppy() {
  document.body.innerHTML = '<div id="app"></div>'
  const tokens = new Map<string, string>()
  return new Uppy()
    .use(Dashboard, { target: '#app', inline: true })
    .use(Dropbox, {
      companionUrl: COMPANION,
      companionKeysParams: { key: 'test-key', credentialsName: 'test-app' },
      storage: {
        getItem: (key) => tokens.get(key) ?? null,
        setItem(key, value) {
          tokens.set(key, value)
        },
        removeItem(key) {
          tokens.delete(key)
        },
      },
    })
}

network.configure({ context: { quiet: true } })
await network.enable()

afterEach(() => network.resetHandlers())

describe('Provider preauthorization', () => {
  test.for([
    { firstResponse: 'list', authenticatedAfterFirst: false },
    { firstResponse: 'preauth', authenticatedAfterFirst: undefined },
  ] as const)('keeps the login button when $firstResponse responds first', async ({
    firstResponse,
    authenticatedAfterFirst,
  }) => {
    const preauth = Promise.withResolvers<Response>()
    const list = Promise.withResolvers<Response>()
    const onPreauth = vi.fn(() => preauth.promise)
    const onList = vi.fn(() => list.promise)
    network.use(
      http.post(`${COMPANION}/dropbox/preauth/`, onPreauth),
      http.get(`${COMPANION}/dropbox/list/`, onList),
    )
    using uppy = initializeUppy()
    const plugin = uppy.getPlugin('Dropbox')!
    using fetchPreauth = vi.spyOn(plugin.provider, 'fetchPreAuthToken')
    using openFolder = vi.spyOn(plugin.view, 'openFolder')
    await page.getByRole('tab', { name: 'Dropbox' }).click()
    await expect
      .poll(() => [onPreauth.mock.calls.length, onList.mock.calls.length])
      .toEqual([1, 1])

    const replies = {
      preauth: () => {
        preauth.resolve(
          HttpResponse.json(
            { token: 'test-preauth-token' },
            { headers: { 'i-am': DISCOVERED_COMPANION } },
          ),
        )
        return fetchPreauth.mock.results[0]!.value
      },
      list: () => {
        list.resolve(new HttpResponse(null, { status: 401 }))
        return openFolder.mock.results[0]!.value
      },
    }
    await replies[firstResponse]()
    expect(plugin.getPluginState().authenticated).toBe(authenticatedAfterFirst)
    await replies[firstResponse === 'list' ? 'preauth' : 'list']()

    expect(plugin.getPluginState().authenticated).toBe(false)
    await expect.element(loginButton()).toBeVisible()
    expect(plugin.provider.preAuthToken).toBe('test-preauth-token')
    expect(plugin.provider.hostname).toBe(DISCOVERED_COMPANION)
    const authUrl = new URL(
      plugin.provider.authUrl({ authFormData: undefined, query: {} }),
    )
    expect(authUrl.origin).toBe(DISCOVERED_COMPANION)
    expect(authUrl.searchParams.get('uppyPreAuthToken')).toBe(
      'test-preauth-token',
    )
  })

  test('authenticates on a successful listing and shows login on session expiry', async () => {
    const preauthHeaders = Promise.withResolvers<Headers>()
    const listingHeaders = Promise.withResolvers<Headers>()
    const onRefresh = vi.fn(() => new HttpResponse(null, { status: 401 }))
    network.use(
      http.post(`${COMPANION}/dropbox/preauth/`, ({ request }) => {
        preauthHeaders.resolve(request.headers)
        return HttpResponse.json({ token: 'test-preauth-token' })
      }),
      http.get(`${COMPANION}/dropbox/list/`, ({ request }) => {
        listingHeaders.resolve(request.headers)
        return HttpResponse.json(LISTING)
      }),
      http.post(`${COMPANION}/dropbox/refresh-token`, onRefresh),
    )
    using uppy = initializeUppy()
    const plugin = uppy.getPlugin('Dropbox')!
    plugin.provider.setCompanionHeaders({ 'x-test-companion': 'preserved' })
    await plugin.provider.setAuthToken('test-session')
    await page.getByRole('tab', { name: 'Dropbox' }).click()
    const headers = await preauthHeaders.promise
    expect(headers.get('uppy-auth-token')).toBeNull()
    expect(headers.get('x-test-companion')).toBe('preserved')
    expect((await listingHeaders.promise).get('uppy-auth-token')).toBe(
      'test-session',
    )
    await expect.poll(() => plugin.getPluginState().authenticated).toBe(true)
    await expect.poll(() => plugin.getPluginState().loading).toBe(false)
    await expect.element(loginButton()).not.toBeInTheDocument()

    network.use(
      http.get(
        `${COMPANION}/dropbox/list/`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    )
    await plugin.view.refreshCurrentFolder()
    expect(onRefresh).toHaveBeenCalledOnce()
    expect(await plugin.storage.getItem(plugin.provider.tokenKey)).toBeNull()
    expect(plugin.getPluginState().authenticated).toBe(false)
    await expect.element(loginButton()).toBeVisible()

    await plugin.provider.fetchPreAuthToken()
    expect(plugin.getPluginState().authenticated).toBe(false)
    await expect.element(loginButton()).toBeVisible()
  })

  test('does not expire or refresh a provider session when preauthorization returns 401', async () => {
    const onRefresh = vi.fn(() => new HttpResponse(null, { status: 401 }))
    network.use(
      http.post(`${COMPANION}/dropbox/preauth/`, () =>
        HttpResponse.json({ token: 'test-preauth-token' }),
      ),
      http.get(`${COMPANION}/dropbox/list/`, () => HttpResponse.json(LISTING)),
      http.post(`${COMPANION}/dropbox/refresh-token`, onRefresh),
    )
    using uppy = initializeUppy()
    const plugin = uppy.getPlugin('Dropbox')!
    await plugin.provider.setAuthToken('test-session')
    await page.getByRole('tab', { name: 'Dropbox' }).click()
    await expect.poll(() => plugin.getPluginState().authenticated).toBe(true)
    await expect.poll(() => plugin.getPluginState().loading).toBe(false)

    network.use(
      http.post(
        `${COMPANION}/dropbox/preauth/`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    )
    await plugin.provider.fetchPreAuthToken()
    expect(onRefresh).not.toHaveBeenCalled()
    expect(await plugin.storage.getItem(plugin.provider.tokenKey)).toBe(
      'test-session',
    )
    expect(plugin.getPluginState().authenticated).toBe(true)
    await expect.element(loginButton()).not.toBeInTheDocument()
  })
})
