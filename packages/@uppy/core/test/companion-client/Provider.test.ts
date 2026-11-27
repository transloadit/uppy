import { network } from 'virtual:msw'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Provider from '../../lib/companion-client/Provider.js'
import Uppy from '../../lib/index.js'
import handleError from '../../lib/provider-views/utils/handleError.js'

network.configure({ context: { quiet: true } })
await network.enable()

afterEach(() => {
  network.resetHandlers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** An OAuth login whose auth window and callback socket the test drives. */
function startOAuthLogin(uppy: Uppy) {
  const authWindow = { closed: false, close() {} }
  vi.spyOn(window, 'open').mockReturnValue(authWindow as Window)
  let socket!: EventTarget
  vi.stubGlobal(
    'WebSocket',
    class extends EventTarget {
      constructor() {
        super()
        socket = this
      }
      close() {
        this.dispatchEvent(new Event('close'))
      }
    },
  )
  const provider = new Provider(uppy, {
    companionUrl: 'http://companion.test',
    provider: 'dropbox',
    pluginId: 'Dropbox',
  })
  const login = provider.login({
    authFormData: {},
    signal: new AbortController().signal,
  })
  return { authWindow, login, socket: () => socket }
}

const shown = (uppy: Uppy) =>
  uppy.getState().info.map(({ message, details }) => ({ message, details }))

describe('Provider', () => {
  it('shows an unreachable Companion before a third-party login', async () => {
    using uppy = new Uppy({ logger: { debug() {}, warn() {}, error() {} } })
    const provider = new Provider(uppy, {
      companionUrl: 'http://companion.test',
      provider: 'dropbox',
      pluginId: 'Dropbox',
      companionKeysParams: { key: 'key', credentialsName: 'name' },
    })
    network.use(
      http.post('http://companion.test/dropbox/preauth/', () =>
        HttpResponse.error(),
      ),
    )

    await provider.ensurePreAuth().catch(handleError(uppy))
    expect(
      uppy
        .getState()
        .info.map(({ message, details }) => ({ message, details })),
    ).toEqual([{ message: 'Connection with Companion failed', details: null }])
  })

  it('says a failed OAuth connection failed, not that the user cancelled', async () => {
    using uppy = new Uppy({ logger: { debug() {}, warn() {}, error() {} } })
    const { login, socket } = startOAuthLogin(uppy)
    await vi.waitFor(() => expect(socket()).toBeDefined())
    socket().dispatchEvent(new Event('close'))

    await login.catch(handleError(uppy))
    expect(shown(uppy)).toEqual([
      { message: 'Connection with Companion failed', details: null },
    ])
  })

  it('says the login was cancelled when the user closes the auth window', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      using uppy = new Uppy({ logger: { debug() {}, warn() {}, error() {} } })
      const { authWindow, login, socket } = startOAuthLogin(uppy)
      await vi.waitFor(() => expect(socket()).toBeDefined())
      authWindow.closed = true
      vi.advanceTimersByTime(500)

      await login.catch(handleError(uppy))
      expect(shown(uppy).map(({ message }) => message)).toEqual([
        uppy.i18n('authAborted'),
      ])
    } finally {
      vi.useRealTimers()
    }
  })
})
