import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Dropbox from '@uppy/dropbox'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, vi } from 'vitest'
import { page } from 'vitest/browser'
import { test } from './test-extend.js'

const COMPANION = 'http://companion.test'
const DISCOVERED_COMPANION = 'http://discovered-companion.test'
const LISTING = { username: 'test-user', items: [], nextPagePath: null }
const loginButton = () =>
  page.getByRole('button', { name: 'Connect to Dropbox' })

let uppy: Uppy | undefined

function initializeUppy() {
  document.body.innerHTML = '<div id="app"></div>'
  const tokens = new Map<string, string>()
  uppy = new Uppy()
    .use(Dashboard, { target: '#app', inline: true })
    .use(Dropbox, {
      companionUrl: COMPANION,
      companionKeysParams: { key: 'test-key', credentialsName: 'test-app' },
      storage: {
        getItem: async (key) => tokens.get(key) ?? null,
        setItem: async (key, value) => {
          tokens.set(key, value)
        },
        removeItem: async (key) => {
          tokens.delete(key)
        },
      },
    })
  return uppy.getPlugin('Dropbox')!
}

afterEach(() => {
  // Unmount the panel before removing the provider it renders.
  const dashboard = uppy?.getPlugin('Dashboard')
  if (dashboard) uppy?.removePlugin(dashboard)
  uppy?.destroy()
  uppy = undefined
  vi.restoreAllMocks()
})

describe('Provider preauthorization', () => {
  for (const firstResponse of ['list', 'preauth'] as const) {
    test(`keeps the login button when ${firstResponse} responds first`, async ({
      worker,
    }) => {
      const preauth = Promise.withResolvers<Response>()
      const list = Promise.withResolvers<Response>()
      const onPreauth = vi.fn(() => preauth.promise)
      const onList = vi.fn(() => list.promise)
      worker.use(
        http.post(`${COMPANION}/dropbox/preauth/`, onPreauth),
        http.get(`${COMPANION}/dropbox/list/`, onList),
      )
      const plugin = initializeUppy()
      const fetchPreauth = vi.spyOn(plugin.provider, 'fetchPreAuthToken')
      const openFolder = vi.spyOn(plugin.view, 'openFolder')
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
      const authenticatedAfterFirst = plugin.getPluginState().authenticated
      await replies[firstResponse === 'list' ? 'preauth' : 'list']()

      expect(authenticatedAfterFirst).toBe(
        firstResponse === 'list' ? false : undefined,
      )
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
  }

  test('authenticates on a successful listing and shows login on session expiry', async ({
    worker,
  }) => {
    const onRefresh = vi.fn(() => new HttpResponse(null, { status: 401 }))
    worker.use(
      http.post(`${COMPANION}/dropbox/preauth/`, () =>
        HttpResponse.json({ token: 'test-preauth-token' }),
      ),
      http.get(`${COMPANION}/dropbox/list/`, ({ request }) => {
        expect(request.headers.get('uppy-auth-token')).toBe('test-session')
        return HttpResponse.json(LISTING)
      }),
      http.post(`${COMPANION}/dropbox/refresh-token`, onRefresh),
    )
    const plugin = initializeUppy()
    await plugin.provider.setAuthToken('test-session')
    await page.getByRole('tab', { name: 'Dropbox' }).click()
    await expect.poll(() => plugin.getPluginState().authenticated).toBe(true)
    await expect.poll(() => plugin.getPluginState().loading).toBe(false)
    expect(plugin.getPluginState().authenticated).toBe(true)
    await expect.element(loginButton()).not.toBeInTheDocument()

    worker.use(
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

  test('does not expire or refresh a provider session when preauthorization returns 401', async ({
    worker,
  }) => {
    const onRefresh = vi.fn(() => new HttpResponse(null, { status: 401 }))
    worker.use(
      http.post(`${COMPANION}/dropbox/preauth/`, () =>
        HttpResponse.json({ token: 'test-preauth-token' }),
      ),
      http.get(`${COMPANION}/dropbox/list/`, () => HttpResponse.json(LISTING)),
      http.post(`${COMPANION}/dropbox/refresh-token`, onRefresh),
    )
    const plugin = initializeUppy()
    await plugin.provider.setAuthToken('test-session')
    await page.getByRole('tab', { name: 'Dropbox' }).click()
    await expect.poll(() => plugin.getPluginState().authenticated).toBe(true)
    await expect.poll(() => plugin.getPluginState().loading).toBe(false)
    expect(plugin.getPluginState().authenticated).toBe(true)

    worker.use(
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
