import type { GooglePickerState } from '../lib/companion-client/googlePicker.js'
import type { AsyncStore } from '../lib/index.js'

import { expect, it, onTestFinished, vi } from 'vitest'

import {
  createGooglePickerController,
  createGooglePickerStoreAdapter,
} from '../lib/companion-client/googlePicker.js'
import Core from '../lib/index.js'

function setup(
  uppy: Core,
  getItem: AsyncStore['getItem'],
  pickerType: 'drive' | 'photos' = 'drive',
) {
  let state: GooglePickerState = { accessToken: undefined, loading: false }
  const controller = createGooglePickerController({
    uppy,
    pickerType,
    clientId: 'client-id',
    apiKey: 'api-key',
    appId: 'app-id',
    requestClientId: 'GooglePicker',
    companionUrl: 'https://companion.example.com',
    store: createGooglePickerStoreAdapter({
      uppy,
      getPluginState: () => state,
      setPluginState: (patch) => {
        state = { ...state, ...patch }
      },
    }),
    storage: { getItem, setItem: async () => {}, removeItem: async () => {} },
  })
  onTestFinished(() => controller.reset())
  return { controller, getState: () => state }
}

it('shares an in-flight show() across overlapping calls and resets', async () => {
  using uppy = new Core()
  const firstRead = Promise.withResolvers<string | null>()
  const secondRead = Promise.withResolvers<string | null>()
  const thirdRead = Promise.withResolvers<string | null>()
  const reads = [firstRead.promise, secondRead.promise, thirdRead.promise]
  const { controller } = setup(uppy, () => reads.shift()!)

  const firstShow = controller.show()
  expect(controller.show()).toBe(firstShow)

  controller.reset()
  const secondShow = controller.show()

  // The pre-reset show settling must not release the newer show's guard.
  firstRead.reject(new Error('Old token read failed'))
  await expect(firstShow).rejects.toThrow('Old token read failed')
  expect(controller.show()).toBe(secondShow)
  // Nor clear the newer read: init() joins it instead of reading again.
  const sameInit = controller.init()
  expect(reads).toHaveLength(1)

  const currentError = new Error('Current token read failed')
  secondRead.reject(currentError)
  await expect(secondShow).rejects.toBe(currentError)
  await expect(sameInit).rejects.toBe(currentError)
  // Released, and the failed read isn't cached: this call reads again.
  const thirdShow = controller.show()
  expect(thirdShow).not.toBe(secondShow)
  const retryError = new Error('Retried token read failed')
  thirdRead.reject(retryError)
  await expect(thirdShow).rejects.toBe(retryError)
})

it('ignores a token read that settles after reset()', async () => {
  using uppy = new Core()
  const firstRead = Promise.withResolvers<string | null>()
  const reads = [firstRead.promise, new Promise<string | null>(() => {})]
  const { controller, getState } = setup(uppy, () => reads.shift()!)

  const firstShow = controller.show()
  controller.reset()
  controller.show()

  firstRead.resolve('old-token')
  // Resolves rather than rejects: the hooks call init() unhandled.
  await expect(firstShow).resolves.toBeUndefined()
  expect(getState()).toEqual({ accessToken: undefined, loading: false })
})

it('a show reset while scripts load leaves the next flow alone', async () => {
  using uppy = new Core()
  const scripts: HTMLScriptElement[] = []
  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    scripts.push(node as HTMLScriptElement)
    return node
  })
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('no network'))
  onTestFinished(() => {
    vi.restoreAllMocks()
  })
  const { controller, getState } = setup(uppy, async () => 'token', 'photos')

  const first = controller.show()
  await vi.waitFor(() => expect(scripts).toHaveLength(2))
  controller.reset()
  controller.show() // the next flow, left waiting on its own scripts
  await vi.waitFor(() => expect(scripts).toHaveLength(4))
  for (const script of scripts.slice(0, 2)) {
    script.dispatchEvent(new Event('load'))
  }
  await first

  expect(fetchSpy).not.toHaveBeenCalled()
  expect(getState()).toEqual({ accessToken: 'token', loading: true })
})
