import '@uppy-dev/msw-setup'

import type { Meta } from '@uppy/core'

import { Uppy, UserFacingApiError } from '@uppy/core'
import { expect, it, vi } from 'vitest'

import Transloadit from '../lib/index.js'

it('keeps a started file retryable and reports refused signing on every retry', async () => {
  const error = new UserFacingApiError(
    'Upload files from one folder at a time.',
  )
  const assemblyOptions = vi.fn(() => Promise.reject(error))
  using uppy = new Uppy().use(Transloadit, {
    assemblyOptions,
    errorReporting: false,
  })
  const id = uppy.addFile({ name: 'retry.txt', data: new Blob(['fixture']) })
  await expect(uppy.upload()).rejects.toBe(error)
  uppy.emit('upload-start', [uppy.getFile(id)])
  await expect(uppy.retryAll()).rejects.toBe(error)
  expect(uppy.getFile(id).error).toBe(error.message)
  expect(uppy.getState().error).toBe(error.message)
  expect(uppy.getState().allowNewUpload).toBe(true)
  expect(uppy.getState().info).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ message: error.message, type: 'error' }),
    ]),
  )
  await expect(uppy.retryAll()).rejects.toBe(error)
  expect(assemblyOptions).toHaveBeenCalledTimes(3)
})

it('preserves another active preparation when a concurrent retry is refused', async () => {
  const entered = Promise.withResolvers<void>()
  const release = Promise.withResolvers<never>()
  const error = new UserFacingApiError('Wait for the running upload to finish.')
  let calls = 0
  using uppy = new Uppy().use(Transloadit, {
    errorReporting: false,
    assemblyOptions: () => {
      calls += 1
      if (calls === 1) {
        entered.resolve()
        return release.promise
      }
      return Promise.reject(error)
    },
  })
  const plugin =
    uppy.getPlugin<Transloadit<Meta, Record<string, never>>>('Transloadit')
  if (!plugin) throw new Error('Missing Transloadit plugin')
  const assignment = vi.spyOn(plugin, 'assembly', 'set')
  const errors = vi.fn()
  uppy.on('error', errors)
  const runningId = uppy.addFile({
    name: 'running.txt',
    data: new Blob(['fixture']),
  })
  const retryId = uppy.addFile({
    name: 'retry.txt',
    data: new Blob(['fixture']),
  })
  const running = uppy.upload()
  try {
    await entered.promise
    await expect(uppy.retryUpload(retryId)).rejects.toBe(error)
    expect(uppy.getFile(retryId).error).toBe(error.message)
    expect(uppy.getState().error).toBe(error.message)
    expect(uppy.getFile(runningId).error == null).toBe(true)
    expect(uppy.getState().allowNewUpload).toBe(false)
    expect(assignment).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
  } finally {
    release.reject(error)
    await expect(running).rejects.toBe(error)
  }
})

it('uses a generic preparation message for diagnostics that are not explicitly user-facing', async () => {
  const error = new Error('Private signing diagnostic')
  using uppy = new Uppy().use(Transloadit, {
    errorReporting: false,
    assemblyOptions: () => {
      return Promise.reject(error)
    },
  })
  const id = uppy.addFile({ name: 'file.txt', data: new Blob(['fixture']) })
  await expect(uppy.upload()).rejects.toBe(error)
  expect(uppy.getFile(id).error).toBe('Transloadit: Could not create Assembly')
  expect(uppy.getState().info).toEqual([
    expect.objectContaining({
      message: 'Transloadit: Could not create Assembly',
    }),
  ])
})
