import { network } from 'virtual:msw'
import { createS3ManagerController } from '@uppy/components'
import Uppy, { BasePlugin } from '@uppy/core'
import {
  createMockS3Companion,
  toMswHandlers,
} from '@uppy-dev/s3-mock-companion'
import { http } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'
import S3 from '../lib/S3.js'

const COMPANION = 'http://localhost:3020'
let uppy: Uppy | undefined

afterEach(() => {
  uppy?.destroy()
  uppy = undefined
  localStorage.clear()
  network.resetHandlers()
})

network.configure({ context: { quiet: true } })
await network.enable()

/** Any other plugin: its state changes must not reach the manager. */
class Other extends BasePlugin<any, any, any> {
  override id = 'Other'
  override type = 'acquirer'
}

it('browses and deletes without a rendered panel', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
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

it('finds the detail item anywhere in the tree, for a recreated controller too', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
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

it('warns about a storage plugin in picker mode', () => {
  uppy = new Uppy().use(S3, { companionUrl: COMPANION })
  const log = vi.spyOn(uppy, 'log')
  createS3ManagerController(uppy, 'S3')
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining("pass `mode: 'manager'`"),
    'warning',
  )
})

it('walks to the initial folder once, StrictMode remounts included', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
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

it('refuses to navigate while an operation can be cancelled', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const plugin = uppy.getPlugin<S3<any, any>>('S3')!
  const walk = vi.spyOn(plugin, 'openFolderPath')
  const manager = createS3ManagerController(uppy, 'S3')
  manager.mount()
  await walk.mock.results[0]!.value
  const docs = manager
    .getSnapshot()
    .state.partialTree.find((item) => item.data.name === 'docs')!

  // A long operation (a folder move, a bulk delete), cancellable meanwhile.
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

  finish()
  await operation
  // It walks once the operation is over.
  await vi.waitFor(() => expect(walk).toHaveBeenCalledTimes(2))
  expect(await walk.mock.results[1]!.value).toBe(true)
  expect(remount.getSnapshot().state.currentFolderId).toBe(docs.id)
  remount.unmount()

  await manager.getSnapshot().open(null)
  await manager.getSnapshot().open(docs.id)
  expect(manager.getSnapshot().state.currentFolderId).toBe(docs.id)
  manager.unmount()
})

it('walks to its folder after a running action and its refresh', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  // Holds the delete request, so the operation runs until `finish()`.
  let finish!: () => void
  const deleting = new Promise<void>((resolve) => {
    finish = resolve
  })
  network.use(
    http.post(`${COMPANION}/s3/mutate/delete`, async () => {
      await deleting
    }),
    ...toMswHandlers(companion, COMPANION, { http }),
  )
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const plugin = uppy.getPlugin<S3<any, any>>('S3')!
  const walk = vi.spyOn(plugin, 'openFolderPath')
  const manager = createS3ManagerController(uppy, 'S3')
  manager.mount()
  await walk.mock.results[0]!.value

  // A built-in action: it relists the folder a few promise ticks after its
  // operation ends, and that listing must not abort the walk below.
  const { state } = manager.getSnapshot()
  const readme = state.partialTree.find(
    (item) => item.data.name === 'readme.md',
  )!
  const remove = state.actions.find((action) => action.id === 's3:delete')!
  const done = manager.getSnapshot().runAction(remove, readme)
  await vi.waitFor(() =>
    expect(manager.getSnapshot().state.dialog?.kind).toBe('confirm'),
  )
  manager.getSnapshot().submitDialog()
  await vi.waitFor(() =>
    expect(manager.getSnapshot().state.cancellable).toBe(true),
  )

  // The user comes back mid-operation, through a link to docs/.
  manager.unmount()
  const remount = createS3ManagerController(uppy, 'S3', {
    initialFolderKey: 'docs/',
  })
  remount.mount()
  expect(walk).toHaveBeenCalledOnce()

  finish()
  await done
  await vi.waitFor(() => expect(walk).toHaveBeenCalledTimes(2))
  expect(await walk.mock.results[1]!.value).toBe(true)
  expect(remount.getSnapshot().state.currentFolderId).toBe(
    encodeURIComponent('docs/'),
  )
  remount.unmount()
})

it('keeps selections in other folders across a refresh', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
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

it('emits for its own plugin only, and survives the plugin being removed', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
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

it('passes login form data through, such as a grant', async () => {
  const companion = createMockS3Companion({ token: 'test-token' })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
  uppy = new Uppy().use(S3, { companionUrl: COMPANION, mode: 'manager' })
  const plugin = uppy.getPlugin<S3<any, any>>('S3')!
  const manager = createS3ManagerController(uppy, 'S3')
  const auth = vi.spyOn(plugin.view, 'handleAuth').mockResolvedValue()

  await manager.getSnapshot().login({ grant: 'signed-grant' })

  expect(auth).toHaveBeenCalledWith({ grant: 'signed-grant' })
})
