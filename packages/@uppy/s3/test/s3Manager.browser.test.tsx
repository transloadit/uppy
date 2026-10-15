import { createS3ManagerController } from '@uppy/components'
import Uppy, { BasePlugin } from '@uppy/core'
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

/** Any other plugin: its state changes must not reach the manager. */
class Other extends BasePlugin<any, any, any> {
  override id = 'Other'
  override type = 'acquirer'
}

it('browses and deletes without a rendered panel', async ({ worker }) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const manager = createS3ManagerController(uppy, 'S3', {
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

it('finds the detail item anywhere in the tree, for a recreated controller too', async ({
  worker,
}) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const manager = createS3ManagerController(uppy, 'S3', {
    initialFolderKey: 'docs/',
  })
  // The spy keeps the implementation; its promise says when the walk is done.
  const walk = vi.spyOn(uppy.getPlugin<S3<any, any>>('S3')!, 'openFolderPath')
  manager.mount()
  await walk.mock.results[0]!.value
  const [hello] = manager.getSnapshot().state.partialTree
  manager.getSnapshot().openDetail(hello!)
  // The root was listed by the walk, so this opens without a request.
  await manager.getSnapshot().open(null)
  expect(manager.getSnapshot().state.detailItem?.id).toBe(hello!.id)

  // A remount gets a new controller: the item is the view's, not the hook's.
  const again = createS3ManagerController(uppy, 'S3')
  expect(again.getSnapshot().state.detailItem?.id).toBe(hello!.id)
  manager.unmount()
})

it('refuses a plugin that is not a manager-mode storage browser', () => {
  uppy = new Uppy().use(Other)
  expect(() => createS3ManagerController(uppy!, 'Other')).toThrow(
    'not a manager-mode storage plugin',
  )
  expect(() => createS3ManagerController(uppy!, 'Nope')).toThrow(
    'not installed',
  )
})

it('walks to the initial folder once, StrictMode remounts included', async ({
  worker,
}) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const walk = vi.spyOn(uppy.getPlugin<S3<any, any>>('S3')!, 'openFolderPath')
  const manager = createS3ManagerController(uppy, 'S3', {
    initialFolderKey: 'docs/',
  })
  // StrictMode mounts, unmounts and mounts again with the same controller.
  manager.mount()
  manager.unmount()
  manager.mount()
  expect(walk).toHaveBeenCalledOnce()
  await walk.mock.results[0]!.value
  expect(manager.getSnapshot().state.breadcrumbs).toHaveLength(2)
  manager.unmount()
})

it('refuses to navigate while an operation can be cancelled', async ({
  worker,
}) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const plugin = uppy.getPlugin<S3<any, any>>('S3')!
  const walk = vi.spyOn(plugin, 'openFolderPath')
  const manager = createS3ManagerController(uppy, 'S3')
  manager.mount()
  await walk.mock.results[0]!.value
  const docs = manager
    .getSnapshot()
    .state.partialTree.find((item) => item.data.name === 'docs')!

  // A long operation (a folder move, a bulk delete) behind the progress screen.
  let finish!: () => void
  const operation = plugin.view.runWithProgress(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  expect(manager.getSnapshot().state.cancellable).toBe(true)

  await manager.getSnapshot().open(docs.id)
  expect(await manager.getSnapshot().openPath('docs/')).toBe(false)
  expect(await manager.getSnapshot().loadMore()).toBe(false)
  expect(manager.getSnapshot().state.currentFolderId).toBe(null)
  // Nor does a remount: its walk to `docs/` would list it and abort the move.
  const remount = createS3ManagerController(uppy, 'S3', {
    initialFolderKey: 'docs/',
  })
  remount.mount()
  expect(walk).toHaveBeenCalledOnce()
  remount.unmount()

  finish()
  await operation
  await manager.getSnapshot().open(docs.id)
  expect(manager.getSnapshot().state.currentFolderId).toBe(docs.id)
  manager.unmount()
})

it('keeps selections in other folders across a refresh', async ({ worker }) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const walk = vi.spyOn(uppy.getPlugin<S3<any, any>>('S3')!, 'openFolderPath')
  const manager = createS3ManagerController(uppy, 'S3')
  manager.mount()
  await walk.mock.results[0]!.value
  const { partialTree } = manager.getSnapshot().state
  const readme = partialTree.find((item) => item.data.name === 'readme.md')!
  const docs = partialTree.find((item) => item.data.name === 'docs')!
  manager.getSnapshot().checkbox(readme, false)

  await manager.getSnapshot().open(docs.id)
  expect(manager.getSnapshot().state.currentFolderId).toBe(docs.id)
  await manager.getSnapshot().refresh()

  expect(manager.getSnapshot().state.selected.map((item) => item.id)).toEqual([
    readme.id,
  ])
  manager.unmount()
})

it('emits for its own plugin only, and survives the plugin being removed', async ({
  worker,
}) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy()
    .use(S3, { companionUrl: COMPANION, mode: 'manager' })
    .use(Other)
  const walk = vi.spyOn(uppy.getPlugin<S3<any, any>>('S3')!, 'openFolderPath')
  const manager = createS3ManagerController(uppy, 'S3')
  const changed = vi.fn()
  manager.subscribe(changed)
  manager.mount()
  await walk.mock.results[0]!.value

  // State updates emit synchronously, so the count is exact between awaits.
  const emitted = changed.mock.calls.length
  uppy.getPlugin('Other')!.setPluginState({ ping: 1 })
  uppy.setState({ meta: { ping: 1 } })
  expect(changed.mock.calls.length).toBe(emitted)

  const last = manager.getSnapshot()
  uppy.removePlugin(uppy.getPlugin('S3')!)
  expect(manager.getSnapshot()).toBe(last)
  manager.unmount()
})

it('passes login form data through, such as a grant', async ({ worker }) => {
  const companion = createMockS3Companion({ token: 'test-token' })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const plugin = uppy.getPlugin<S3<any, any>>('S3')!
  const manager = createS3ManagerController(uppy, 'S3')
  const auth = vi.spyOn(plugin.view, 'handleAuth').mockResolvedValue()

  await manager.getSnapshot().login({ grant: 'signed-grant' })

  expect(auth).toHaveBeenCalledWith({ grant: 'signed-grant' })
})
