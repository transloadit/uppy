import { expect, it, onTestFinished, vi } from 'vitest'
import {
  createGooglePickerController,
  createGooglePickerStoreAdapter,
  type GooglePickerState,
} from '../lib/companion-client/googlePicker.js'
import Core, { type AsyncStore } from '../lib/index.js'

it('keeps a new show guarded when a pre-reset show settles', async () => {
  const uppy = new Core()
  const firstRead = Promise.withResolvers<string | null>()
  const secondRead = Promise.withResolvers<string | null>()
  let state: GooglePickerState = {
    accessToken: undefined,
    loading: false,
  }

  const controller = createGooglePickerController({
    uppy,
    pickerType: 'drive',
    clientId: 'client-id',
    apiKey: 'api-key',
    appId: 'app-id',
    requestClientId: 'GoogleDrivePicker',
    companionUrl: 'https://companion.example.com',
    store: createGooglePickerStoreAdapter({
      uppy,
      getPluginState: () => state,
      setPluginState: (patch) => {
        state = { ...state, ...patch }
      },
    }),
    storage: {
      getItem: vi
        .fn<AsyncStore['getItem']>()
        .mockReturnValueOnce(firstRead.promise)
        .mockReturnValueOnce(secondRead.promise),
      setItem: async () => {},
      removeItem: async () => {},
    },
  })
  onTestFinished(() => {
    controller.reset()
    uppy.destroy()
  })

  const firstShow = controller.show()
  controller.reset()
  const secondShow = controller.show()

  const oldError = new Error('Old token read failed')
  firstRead.reject(oldError)
  await expect(firstShow).rejects.toBe(oldError)

  let duplicateWasIgnored = false
  const duplicateShow = controller.show().then(
    () => {
      duplicateWasIgnored = true
    },
    () => {},
  )
  await Promise.resolve()
  const ignoredWhilePending = duplicateWasIgnored

  const currentError = new Error('Current token read failed')
  secondRead.reject(currentError)
  await expect(secondShow).rejects.toBe(currentError)
  await duplicateShow

  expect(ignoredWhilePending).toBe(true)
  await expect(controller.show()).rejects.toBe(currentError)
})
