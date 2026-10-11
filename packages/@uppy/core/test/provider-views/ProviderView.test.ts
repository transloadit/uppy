import { describe, expect, it } from 'vitest'
import BasePlugin from '../../lib/BasePlugin.js'
import Core from '../../lib/index.js'
import { ProviderViews } from '../../lib/provider-views/index.js'

const companionFile = (id: string, isFolder = false) => ({
  id,
  name: id,
  requestPath: id,
  isFolder,
  icon: '',
  type: isFolder ? 'folder' : 'file',
  mimeType: isFolder ? '' : 'text/plain',
  extension: isFolder ? '' : 'txt',
  size: 1,
  modifiedDate: '2020-01-01T00:00:00Z',
})

const listings: Record<string, ReturnType<typeof companionFile>[]> = {
  root: [companionFile('folder-a', true)],
  'folder-a': [companionFile('a1.txt'), companionFile('a2.txt')],
}

// A real ProviderView over a stubbed provider, so no Companion is involved.
class FakeProvider extends BasePlugin<any, any, any, any> {
  rootFolderId = null
  files = []
  provider = {
    name: 'Fake',
    provider: 'fake',
    login: async () => {},
    logout: async () => {},
    fetchPreAuthToken: async () => {},
    fileUrl: (path: string) => `https://companion.test/fake/get/${path}`,
    list: async (path: string | null) => ({
      username: 'test',
      nextPagePath: null,
      items: listings[path ?? 'root'],
    }),
    search: async () => ({}),
  }

  view!: InstanceType<typeof ProviderViews>

  constructor(uppy: Core<any, any>) {
    super(uppy, { companionUrl: 'https://companion.test' })
    this.id = 'Fake'
    this.type = 'acquirer'
  }

  override install() {
    this.view = new ProviderViews(this as any, {
      provider: this.provider as any,
    })
  }
}

async function setup(restrictions = {}) {
  const uppy = new Core({ restrictions })
  uppy.use(FakeProvider)
  const plugin = uppy.getPlugin('Fake') as unknown as FakeProvider
  await plugin.view.openFolder(null)
  const folder = plugin
    .getPluginState()
    .partialTree.find((node: any) => node.id === 'folder-a')
  // tick the not-yet-fetched folder at the root, as a user would
  plugin.view.toggleCheckbox(folder, false)
  return { uppy, plugin }
}

const currentError = (plugin: FakeProvider) =>
  plugin.view.validateAggregateRestrictions(plugin.getPluginState().partialTree)

describe('ProviderView#donePicking', () => {
  it('resolves true and adds the files', async () => {
    const { uppy, plugin } = await setup()
    await expect(plugin.view.donePicking()).resolves.toBe(true)
    expect(uppy.getFiles()).toHaveLength(2)
  })

  it('resolves false and adds nothing when the folder exceeds maxNumberOfFiles', async () => {
    const { uppy, plugin } = await setup({ maxNumberOfFiles: 1 })
    // before enrichment the checked folder contributes no files, so no error yet
    expect(currentError(plugin)).toBeNull()
    await expect(plugin.view.donePicking()).resolves.toBe(false)
    expect(uppy.getFiles()).toHaveLength(0)
    expect(currentError(plugin)).toMatch(/1 file/)
  })

  it('resolves false when a pick is already in progress', async () => {
    const { uppy, plugin } = await setup()
    const first = plugin.view.donePicking()
    await expect(plugin.view.donePicking()).resolves.toBe(false)
    await expect(first).resolves.toBe(true)
    expect(uppy.getFiles()).toHaveLength(2)
  })
})
