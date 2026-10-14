import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Provider from '../../src/companion-client/Provider.js'
import Uppy, { UIPlugin } from '../../src/index.js'

class MockPlugin extends UIPlugin<any, any, any, any> {
  constructor(uppy: Uppy, opts: any) {
    super(uppy, opts)
    this.id = opts.id || 'MockPlugin'
    this.type = 'acquirer'
  }

  storage = {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  }
}

class MockWebSocket extends EventTarget {
  close = vi.fn()
}

describe('Provider.loginOAuth', () => {
  const OriginalWebSocket = window.WebSocket

  beforeEach(() => {
    ;(window as any).WebSocket = MockWebSocket
  })

  afterEach(() => {
    window.WebSocket = OriginalWebSocket
  })

  it('emits authAborted and throws AbortError when abort signal fires', async () => {
    const uppy = new Uppy()
    uppy.use(MockPlugin, { id: 'test-provider' })

    const provider = new Provider(uppy, {
      companionUrl: 'http://localhost:3020',
      provider: 'drive',
      pluginId: 'test-provider',
    })

    vi.spyOn(window, 'open').mockReturnValue({
      closed: false,
      close: vi.fn(),
    } as any)

    const infoSpy = vi.spyOn(uppy, 'info')
    const controller = new AbortController()

    const loginPromise = provider.login({
      authFormData: {},
      signal: controller.signal,
    })

    controller.abort()

    await expect(loginPromise).rejects.toMatchObject({
      name: 'AbortError',
    })

    expect(infoSpy).toHaveBeenCalledWith(
      { message: 'Authentication aborted' },
      'warning',
      5000,
    )
  })

  it('emits authAborted and throws AbortError when auth window is closed by user', async () => {
    const uppy = new Uppy()
    uppy.use(MockPlugin, { id: 'test-provider' })

    const provider = new Provider(uppy, {
      companionUrl: 'http://localhost:3020',
      provider: 'drive',
      pluginId: 'test-provider',
    })

    const mockWindow = {
      closed: false,
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(mockWindow as any)

    const infoSpy = vi.spyOn(uppy, 'info')
    const controller = new AbortController()

    const loginPromise = provider.login({
      authFormData: {},
      signal: controller.signal,
    })

    mockWindow.closed = true

    await expect(loginPromise).rejects.toMatchObject({
      name: 'AbortError',
    })

    expect(infoSpy).toHaveBeenCalledWith(
      { message: 'Authentication aborted' },
      'warning',
      5000,
    )
  })

  it('bubbles up non-cancellation errors without emitting authAborted', async () => {
    const uppy = new Uppy()
    uppy.use(MockPlugin, { id: 'test-provider' })

    const provider = new Provider(uppy, {
      companionUrl: 'http://localhost:3020',
      provider: 'drive',
      pluginId: 'test-provider',
    })

    vi.spyOn(window, 'open').mockImplementation(() => {
      throw new Error('Popups blocked or security error')
    })

    const infoSpy = vi.spyOn(uppy, 'info')
    const controller = new AbortController()

    await expect(
      provider.login({
        authFormData: {},
        signal: controller.signal,
      }),
    ).rejects.toThrow('Popups blocked or security error')

    expect(infoSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication aborted' }),
      expect.anything(),
      expect.anything(),
    )
  })
})
