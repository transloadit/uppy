import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeFolderRoot,
  PartialTreeId,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import { describe, expect, it, vi } from 'vitest'
import afterFill from './afterFill.js'
import afterOpenFolder from './afterOpenFolder.js'
import afterScrollFolder from './afterScrollFolder.js'
import afterToggleCheckbox from './afterToggleCheckbox.js'
import getBreadcrumbs from './getBreadcrumbs.js'
import getCheckedFilesWithPaths from './getCheckedFilesWithPaths.js'
import getNumberOfSelectedFiles from './getNumberOfSelectedFiles.js'

const _root = (id: string, options: any = {}): PartialTreeFolderRoot => ({
  type: 'root',
  id,
  cached: true,
  nextPagePath: null,
  ...options,
})

const _cFile = (id: string) =>
  ({
    id,
    requestPath: id,
    name: `name_${id}.jpg`,
    isFolder: false,
  }) as CompanionFile

const _cFolder = (id: string) =>
  ({
    id,
    requestPath: id,
    name: `name_${id}`,
    isFolder: true,
  }) as CompanionFile

const _folder = (id: string, options: any): PartialTreeFolderNode => ({
  type: 'folder',
  id,
  cached: true,
  nextPagePath: null,
  status: 'unchecked',
  data: _cFolder(id),
  ...options,
})

const _file = (id: string, options: any): PartialTreeFile => ({
  type: 'file',
  id,
  status: 'unchecked',
  parentId: options.parentId,
  data: _cFile(id),
  ...options,
})

const getFolder = (tree: PartialTree, id: string) =>
  tree.find((i) => i.id === id) as PartialTreeFolderNode
const getFile = (tree: PartialTree, id: string) =>
  tree.find((i) => i.id === id) as PartialTreeFile

describe('afterFill()', () => {
  it('preserves .checked files in an already .cached folder', async () => {
    // prettier-ignore
    const tree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', { parentId: 'ourRoot', cached: true }),
      _file('2_1', { parentId: '2' }),
      _file('2_2', { parentId: '2', status: 'checked' }),
      _file('2_3', { parentId: '2' }),
      _folder('2_4', { parentId: '2' }),
      _file('3', { parentId: 'ourRoot' }),
      _file('4', { parentId: 'ourRoot' }),
    ]
    const mock = vi.fn()
    const enrichedTree = await afterFill(
      tree,
      mock,
      () => null,
      () => {},
    )

    // While we're at it - make sure we're not doing excessive api calls!
    expect(mock.mock.calls.length).toEqual(0)

    const checkedFiles = enrichedTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    )
    expect(checkedFiles.length).toEqual(1)
    expect(checkedFiles[0].id).toEqual('2_2')
  })

  it('fetches a .checked folder', async () => {
    // prettier-ignore
    const tree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', { parentId: 'ourRoot', cached: false, status: 'checked' }),
    ]
    const mock = (path: PartialTreeId) => {
      if (path === '2') {
        const items = [_cFile('2_1'), _cFile('2_2')]
        return Promise.resolve({ nextPagePath: '666', items })
      }
      if (path === '666') {
        const items = [_cFile('2_3'), _cFile('2_4')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      return Promise.reject()
    }
    const enrichedTree = await afterFill(
      tree,
      mock,
      () => null,
      () => {},
    )

    const checkedFiles = enrichedTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    )
    expect(checkedFiles.length).toEqual(4)
    expect(checkedFiles.map((f) => f.id)).toEqual(['2_1', '2_2', '2_3', '2_4'])
  })

  it('fetches remaining pages in a folder', async () => {
    // prettier-ignore
    const tree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', {
        parentId: 'ourRoot',
        cached: true,
        nextPagePath: '666',
        status: 'checked',
      }),
    ]
    const mock = (path: PartialTreeId) => {
      if (path === '666') {
        const items = [_cFile('111'), _cFile('222')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      return Promise.reject()
    }
    const enrichedTree = await afterFill(
      tree,
      mock,
      () => null,
      () => {},
    )

    const checkedFiles = enrichedTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    )
    expect(checkedFiles.length).toEqual(2)
    expect(checkedFiles.map((f) => f.id)).toEqual(['111', '222'])
  })

  it('fetches a folder two levels deep', async () => {
    // prettier-ignore
    const tree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', {
        parentId: 'ourRoot',
        cached: true,
        nextPagePath: '2_next',
        status: 'checked',
      }),
      _file('2_1', { parentId: '2', status: 'checked' }),
      _file('2_2', { parentId: '2', status: 'checked' }),
    ]
    const mock = (path: PartialTreeId) => {
      if (path === '2_next') {
        const items = [_cFile('2_3'), _cFolder('666')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      if (path === '666') {
        const items = [_cFile('666_1'), _cFile('666_2')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      return Promise.reject()
    }
    const enrichedTree = await afterFill(
      tree,
      mock,
      () => null,
      () => {},
    )

    const checkedFiles = enrichedTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    )
    expect(checkedFiles.length).toEqual(5)
    expect(checkedFiles.map((f) => f.id)).toEqual([
      '2_1',
      '2_2',
      '2_3',
      '666_1',
      '666_2',
    ])
  })

  it('complex situation', async () => {
    // prettier-ignore
    const tree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      // folder we'll be recursively fetching really deeply
      _folder('2', {
        parentId: 'ourRoot',
        cached: true,
        nextPagePath: '2_next',
        status: 'checked',
      }),
      _file('2_1', { parentId: '2', status: 'checked' }),
      _file('2_2', { parentId: '2', status: 'checked' }),
      // folder with only some files checked
      _folder('3', { parentId: 'ourRoot', cached: true, status: 'partial' }),
      // empty folder
      _folder('0', { parentId: '3', cached: false, status: 'checked' }),
      _file('3_1', { parentId: '3', status: 'checked' }),
      _file('3_2', { parentId: '3', status: 'unchecked' }),
    ]
    const mock = (path: PartialTreeId) => {
      if (path === '2_next') {
        const items = [_cFile('2_3'), _cFolder('666')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      if (path === '666') {
        const items = [_cFile('666_1'), _cFolder('777')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      if (path === '777') {
        const items = [_cFile('777_1'), _cFolder('777_2')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      if (path === '777_2') {
        const items = [_cFile('777_2_1')]
        return Promise.resolve({ nextPagePath: '777_2_next', items })
      }
      if (path === '777_2_next') {
        const items = [_cFile('777_2_1_1')]
        return Promise.resolve({ nextPagePath: null, items })
      }
      if (path === '0') {
        return Promise.resolve({ nextPagePath: null, items: [] })
      }
      return Promise.reject()
    }
    const enrichedTree = await afterFill(
      tree,
      mock,
      () => null,
      () => {},
    )

    const checkedFiles = enrichedTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    )
    expect(checkedFiles.length).toEqual(8)
    expect(checkedFiles.map((f) => f.id)).toEqual([
      '2_1',
      '2_2',
      '3_1',
      '2_3',
      '666_1',
      '777_1',
      '777_2_1',
      '777_2_1_1',
    ])
  })
})

describe('afterOpenFolder()', () => {
  it('open "checked" folder - all discovered files are marked as "checked"', () => {
    // prettier-ignore
    const oldPartialTree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', { parentId: 'ourRoot', cached: false, status: 'checked' }),
    ]

    const fakeCompanionFiles = [
      { requestPath: '666', isFolder: true },
      { requestPath: '777', isFolder: false },
      { requestPath: '888', isFolder: false },
    ] as CompanionFile[]

    const clickedFolder = oldPartialTree.find(
      (f) => f.id === '2',
    ) as PartialTreeFolderNode

    const newTree = afterOpenFolder(
      oldPartialTree,
      fakeCompanionFiles,
      clickedFolder,
      null,
      () => null,
    )

    expect(getFolder(newTree, '666').status).toEqual('checked')
    expect(getFile(newTree, '777').status).toEqual('checked')
    expect(getFile(newTree, '888').status).toEqual('checked')
  })

  it('open "unchecked" folder - all discovered files are marked as "unchecked"', () => {
    // prettier-ignore
    const oldPartialTree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', { parentId: 'ourRoot', cached: false, status: 'unchecked' }),
    ]

    const fakeCompanionFiles = [
      { requestPath: '666', isFolder: true },
      { requestPath: '777', isFolder: false },
      { requestPath: '888', isFolder: false },
    ] as CompanionFile[]

    const clickedFolder = oldPartialTree.find(
      (f) => f.id === '2',
    ) as PartialTreeFolderNode

    const newTree = afterOpenFolder(
      oldPartialTree,
      fakeCompanionFiles,
      clickedFolder,
      null,
      () => null,
    )

    expect(getFolder(newTree, '666').status).toEqual('unchecked')
    expect(getFile(newTree, '777').status).toEqual('unchecked')
    expect(getFile(newTree, '888').status).toEqual('unchecked')
  })
})

describe('afterScrollFolder()', () => {
  it('scroll "checked" folder - all discovered files are marked as "checked"', () => {
    // prettier-ignore
    const oldPartialTree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', { parentId: 'ourRoot', cached: true, status: 'checked' }),
      _file('2_1', { parentId: '2' }),
      _file('2_2', { parentId: '2' }),
      _file('2_3', { parentId: '2' }),
    ]

    const fakeCompanionFiles = [
      { requestPath: '666', isFolder: true },
      { requestPath: '777', isFolder: false },
      { requestPath: '888', isFolder: false },
    ] as CompanionFile[]

    const newTree = afterScrollFolder(
      oldPartialTree,
      '2',
      fakeCompanionFiles,
      null,
      () => null,
    )

    expect(getFolder(newTree, '666').status).toEqual('checked')
    expect(getFile(newTree, '777').status).toEqual('checked')
    expect(getFile(newTree, '888').status).toEqual('checked')
  })

  it('scroll "checked" folder - all discovered files are marked as "unchecked"', () => {
    // prettier-ignore
    const oldPartialTree: PartialTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot' }),
      _folder('2', { parentId: 'ourRoot', cached: true, status: 'unchecked' }),
      _file('2_1', { parentId: '2' }),
      _file('2_2', { parentId: '2' }),
      _file('2_3', { parentId: '2' }),
    ]

    const fakeCompanionFiles = [
      { requestPath: '666', isFolder: true },
      { requestPath: '777', isFolder: false },
      { requestPath: '888', isFolder: false },
    ] as CompanionFile[]

    const newTree = afterScrollFolder(
      oldPartialTree,
      '2',
      fakeCompanionFiles,
      null,
      () => null,
    )

    expect(getFolder(newTree, '666').status).toEqual('unchecked')
    expect(getFile(newTree, '777').status).toEqual('unchecked')
    expect(getFile(newTree, '888').status).toEqual('unchecked')
  })
})

describe('afterToggleCheckbox()', () => {
  // prettier-ignore
  const oldPartialTree: PartialTree = [
    _root('ourRoot'),
    _folder('1', { parentId: 'ourRoot' }),
    _folder('2', { parentId: 'ourRoot' }),
    _file('2_1', { parentId: '2' }),
    _file('2_2', { parentId: '2' }),
    _file('2_3', { parentId: '2' }),
    _folder('2_4', { parentId: '2' }), // click
    _file('2_4_1', { parentId: '2_4' }),
    _file('2_4_2', { parentId: '2_4' }),
    _file('2_4_3', { parentId: '2_4' }),
    _file('3', { parentId: 'ourRoot' }),
    _file('4', { parentId: 'ourRoot' }),
  ]

  it('check folder: percolates up and down', () => {
    const newTree = afterToggleCheckbox(oldPartialTree, ['2_4'])

    expect(getFolder(newTree, '2_4').status).toEqual('checked')
    // percolates down
    expect(getFile(newTree, '2_4_1').status).toEqual('checked')
    expect(getFile(newTree, '2_4_2').status).toEqual('checked')
    expect(getFile(newTree, '2_4_3').status).toEqual('checked')
    // percolates up
    expect(getFolder(newTree, '2').status).toEqual('partial')
  })

  it('uncheck folder: percolates up and down', () => {
    const treeAfterClick1 = afterToggleCheckbox(oldPartialTree, ['2_4'])

    const tree = afterToggleCheckbox(treeAfterClick1, ['2_4'])

    expect(getFolder(tree, '2_4').status).toEqual('unchecked')
    // percolates down
    expect(getFile(tree, '2_4_1').status).toEqual('unchecked')
    expect(getFile(tree, '2_4_2').status).toEqual('unchecked')
    expect(getFile(tree, '2_4_3').status).toEqual('unchecked')
    // percolates up
    expect(getFolder(tree, '2').status).toEqual('unchecked')
  })

  it('gradually check all subfolders: marks parent folder as checked', () => {
    const tree = afterToggleCheckbox(oldPartialTree, [
      '2_4_1',
      '2_4_2',
      '2_4_3',
    ])

    // marks children as checked
    expect(getFolder(tree, '2_4_1').status).toEqual('checked')
    expect(getFolder(tree, '2_4_2').status).toEqual('checked')
    expect(getFolder(tree, '2_4_3').status).toEqual('checked')
    // marks parent folder as checked
    expect(getFolder(tree, '2_4').status).toEqual('checked')
    // marks parent parent folder as partially checked
    expect(getFolder(tree, '2').status).toEqual('partial')
    // and just randomly making sure unnrelated items didn't get checked
    expect(getFile(tree, '3').status).toEqual('unchecked')
    expect(getFile(tree, '2_2').status).toEqual('unchecked')
  })

  it('clicking partial folder: partial => checked => unchecked', () => {
    // 1. click on 2_4_1, thus making 2_4 "partial"
    const tree_1 = afterToggleCheckbox(oldPartialTree, ['2_4_1'])

    expect(getFolder(tree_1, '2_4').status).toEqual('partial')
    // and test children while we're at it
    expect(getFolder(tree_1, '2_4_1').status).toEqual('checked')

    // 2. click on 2_4, thus making 2_4 "checked"
    const tree_2 = afterToggleCheckbox(tree_1, ['2_4'])

    expect(getFolder(tree_2, '2_4').status).toEqual('checked')
    // and test children while we're at it
    expect(getFolder(tree_2, '2_4_1').status).toEqual('checked')
    expect(getFolder(tree_2, '2_4_2').status).toEqual('checked')
    expect(getFolder(tree_2, '2_4_3').status).toEqual('checked')

    // 3. click on 2_4, thus making 2_4 "unchecked"
    const tree_3 = afterToggleCheckbox(tree_2, ['2_4'])

    expect(getFolder(tree_3, '2_4').status).toEqual('unchecked')
    // and test children while we're at it
    expect(getFolder(tree_3, '2_4_1').status).toEqual('unchecked')
    expect(getFolder(tree_3, '2_4_2').status).toEqual('unchecked')
    expect(getFolder(tree_3, '2_4_3').status).toEqual('unchecked')
  })

  it('old partialTree is NOT mutated', () => {
    const oldPartialTreeCopy = JSON.parse(JSON.stringify(oldPartialTree))
    afterToggleCheckbox(oldPartialTree, ['2_4_1'])
    expect(oldPartialTree).toEqual(oldPartialTreeCopy)
  })
})

describe('getNumberOfSelectedFiles()', () => {
  it('gets all leaf items', () => {
    // prettier-ignore
    const tree: PartialTree = [
      _root('ourRoot'),
      // leaf .checked folder
      _folder('1', { parentId: 'ourRoot', cached: false, status: 'checked' }),
      // NON-left .checked folder
      _folder('2', { parentId: 'ourRoot', status: 'checked' }),
      // leaf .checked file
      _file('2_1', { parentId: '2', status: 'checked' }),
      // leaf .checked file
      _file('2_2', { parentId: '2', status: 'checked' }),
    ]
    const result = getNumberOfSelectedFiles(tree)

    expect(result).toEqual(3)
  })

  it('empty folder, even after being opened, counts as leaf node', () => {
    // prettier-ignore
    const tree: PartialTree = [
      _root('ourRoot'),
      // empty .checked .cached folder
      _folder('1', { parentId: 'ourRoot', cached: true, status: 'checked' }),
    ]
    const result = getNumberOfSelectedFiles(tree)
    // This should be "1" for more pleasant UI - if the user unchecks this folder,
    // they should immediately see "Selected (1)" turning into "Selected (0)".
    expect(result).toEqual(1)
  })
})

describe('getCheckedFilesWithPaths()', () => {
  // Note that this is a tree that doesn't require any api calls, everything is cached already
  // prettier-ignore
  const tree: PartialTree = [
    _root('ourRoot'),
    _folder('1', { parentId: 'ourRoot' }),
    _folder('2', { parentId: 'ourRoot' }),
    _file('2_1', { parentId: '2' }),
    _file('2_2', { parentId: '2', status: 'checked' }),
    _file('2_3', { parentId: '2' }),
    _folder('2_4', { parentId: '2', status: 'checked' }),
    _file('2_4_1', { parentId: '2_4', status: 'checked' }),
    _file('2_4_2', { parentId: '2_4', status: 'checked' }),
    _file('2_4_3', { parentId: '2_4', status: 'checked' }),
    _file('3', { parentId: 'ourRoot' }),
    _file('4', { parentId: 'ourRoot' }),
  ]

  // These test cases are based on documentation for .absolutePath and .relativePath (https://uppy.io/docs/uppy/#filemeta)
  it('.absolutePath always begins with / + always ends with the file’s name.', () => {
    const result = getCheckedFilesWithPaths(tree)

    expect(result.find((f) => f.id === '2_2')!.absDirPath).toEqual(
      '/name_2/name_2_2.jpg',
    )
    expect(result.find((f) => f.id === '2_4_3')!.absDirPath).toEqual(
      '/name_2/name_2_4/name_2_4_3.jpg',
    )
  })

  it('.relativePath is null when file is selected independently', () => {
    const result = getCheckedFilesWithPaths(tree)

    // .relDirPath should be `undefined`, which will make .relativePath `null` eventually
    expect(result.find((f) => f.id === '2_2')!.relDirPath).toEqual(undefined)
  })

  it('.relativePath attends to highest checked folder', () => {
    const result = getCheckedFilesWithPaths(tree)

    expect(result.find((f) => f.id === '2_4_1')!.relDirPath).toEqual(
      'name_2_4/name_2_4_1.jpg',
    )
  })

  // (See github.com/transloadit/uppy/pull/5050#discussion_r1638523560)
  it('file ids such as "hasOwnProperty" are safe', () => {
    const weirdIdsTree = [
      _root('ourRoot'),
      _folder('1', { parentId: 'ourRoot', status: 'checked' }),
      _file('hasOwnProperty', { parentId: '1', status: 'checked' }),
    ]
    const result = getCheckedFilesWithPaths(weirdIdsTree)

    expect(result.find((f) => f.id === 'hasOwnProperty')!.relDirPath).toEqual(
      'name_1/name_hasOwnProperty.jpg',
    )
  })
})

describe('getBreadcrumbs()', () => {
  // prettier-ignore
  const tree: PartialTree = [
    _root('ourRoot'),
    _folder('1', { parentId: 'ourRoot' }),
    _folder('2', { parentId: 'ourRoot' }),
    _file('2_1', { parentId: '2' }),
    _file('2_2', { parentId: '2' }),
    _file('2_3', { parentId: '2' }),
    _folder('2_4', { parentId: '2' }),
    _file('2_4_1', { parentId: '2_4' }),
    _file('2_4_2', { parentId: '2_4' }),
    _file('2_4_3', { parentId: '2_4' }),
    _file('3', { parentId: 'ourRoot' }),
    _file('4', { parentId: 'ourRoot' }),
  ]

  it('returns root folder: "/ourRoot"', () => {
    const result = getBreadcrumbs(tree, 'ourRoot')
    expect(result.map((f) => f.id)).toEqual(['ourRoot'])
  })

  it('returns nested folder: "/ourRoot/4"', () => {
    const result = getBreadcrumbs(tree, '4')
    expect(result.map((f) => f.id)).toEqual(['ourRoot', '4'])
  })

  it('returns deeply nested folder: "/ourRoot/2/2_4"', () => {
    const result = getBreadcrumbs(tree, '2_4')
    expect(result.map((f) => f.id)).toEqual(['ourRoot', '2', '2_4'])
  })

  it('returns folders when currentFolderId=null', () => {
    // prettier-ignore
    const treeWithNullRoot: PartialTree = [
      _root(null!),
      _folder('1', { parentId: null }),
    ]
    const result = getBreadcrumbs(treeWithNullRoot, null)
    expect(result.map((f) => f.id)).toEqual([null])
  })
})
