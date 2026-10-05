import { createStorageManagerController } from '@uppy/components'
import Uppy from '@uppy/core'
import {
  createMockS3Companion,
  toMswHandlers,
} from '@uppy-dev/s3-mock-companion'
import { http } from 'msw'
import { afterEach, expect, vi } from 'vitest'
import S3 from '../lib/S3.js'
import { it } from './test-extend.js'

const COMPANION = 'http://localhost:3020'
let uppy: Uppy | undefined

afterEach(() => {
  uppy?.destroy()
  uppy = undefined
  localStorage.clear()
})

it('browses and deletes without a rendered panel', async ({ worker }) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const manager = createStorageManagerController(uppy, 'S3', {
    initialFolderKey: 'docs/',
  })
  const names = () =>
    manager.getSnapshot().state.partialTree.map((item) => item.data.name)
  manager.mount()

  await vi.waitFor(() => expect(names()).toEqual(['hello.txt']))
  const { state } = manager.getSnapshot()
  expect(state.breadcrumbs.map((crumb) => crumb.id)).toHaveLength(2)

  expect(state.cancellable).toBe(false)

  // The detail survives the refresh that empties the folder meanwhile.
  manager.getSnapshot().openDetail(state.partialTree[0]!)
  const refreshing = manager.getSnapshot().refresh()
  expect(manager.getSnapshot().state.detailItem?.id).toBe(
    state.partialTree[0]!.id,
  )
  await refreshing
  manager.getSnapshot().closeDetail()

  const remove = state.actions.find((action) => action.id === 's3:delete')!
  const done = manager.getSnapshot().runAction(remove, state.partialTree[0]!)
  await vi.waitFor(() =>
    expect(manager.getSnapshot().state.dialog?.kind).toBe('confirm'),
  )
  manager.getSnapshot().submitDialog()
  await done

  expect(names()).toEqual([])
  expect(companion.lastCall('/s3/mutate/delete')).toBeDefined()
  manager.unmount()
})
