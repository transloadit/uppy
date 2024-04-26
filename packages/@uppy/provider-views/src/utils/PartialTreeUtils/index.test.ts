import { describe, expect, it } from 'vitest'
import afterToggleCheckbox from './afterToggleCheckbox.ts'
import type { PartialTree, PartialTreeFile, PartialTreeFolderNode, PartialTreeFolderRoot } from '@uppy/core/lib/Uppy.ts'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import afterClickOnFolder from './afterClickOnFolder.ts'

const _root = (id: string, options: any = {}) : PartialTreeFolderRoot => ({
  type: 'root',
  id,
  cached: true,
  nextPagePath: null,
  ...options
})

const _folder = (id: string, options: any) : PartialTreeFolderNode => ({
  type: 'folder',
  id,
  cached: true,
  nextPagePath: null,
  status: 'unchecked',
  data: ({} as CompanionFile),
  ...options
})

const _file = (id: string, options: any) : PartialTreeFile => ({
  type: 'file',
  id,
  status: 'unchecked',
  parentId: options.parentId,
  data: ({} as CompanionFile),
  ...options
})



const getFolder = (tree: PartialTree, id: string) =>
  tree.find((i) => i.id === id) as PartialTreeFolderNode
const getFile = (tree: PartialTree, id: string) =>
  tree.find((i) => i.id === id) as PartialTreeFile

describe('afterToggleCheckbox', () => {
  const oldPartialTree : PartialTree = [
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
    const newTree = afterToggleCheckbox(oldPartialTree, ['2_4'], () => null)

    expect(getFolder(newTree, '2_4').status).toEqual('checked')
    // percolates down
    expect(getFile(newTree, '2_4_1').status).toEqual('checked')
    expect(getFile(newTree, '2_4_2').status).toEqual('checked')
    expect(getFile(newTree, '2_4_3').status).toEqual('checked')
    // percolates up
    expect(getFolder(newTree, '2').status).toEqual('partial')
  })

  it('uncheck folder: percolates up and down', () => {
    const treeAfterClick1 = afterToggleCheckbox(oldPartialTree, ['2_4'], () => null)

    const tree = afterToggleCheckbox(treeAfterClick1, ['2_4'], () => null)

    expect(getFolder(tree, '2_4').status).toEqual('unchecked')
    // percolates down
    expect(getFile(tree, '2_4_1').status).toEqual('unchecked')
    expect(getFile(tree, '2_4_2').status).toEqual('unchecked')
    expect(getFile(tree, '2_4_3').status).toEqual('unchecked')
    // percolates up
    expect(getFolder(tree, '2').status).toEqual('unchecked')
  })

  it('gradually check all subfolders: marks parent folder as checked', () => {
    const tree = afterToggleCheckbox(oldPartialTree, ['2_4_1', '2_4_2', '2_4_3'], () => null)

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
    const tree_1 = afterToggleCheckbox(oldPartialTree, ['2_4_1'], () => null)

    expect(getFolder(tree_1, '2_4').status).toEqual('partial')
    // and test children while we're at it
    expect(getFolder(tree_1, '2_4_1').status).toEqual('checked')

    // 2. click on 2_4, thus making 2_4 "checked"
    const tree_2 = afterToggleCheckbox(tree_1, ['2_4'], () => null)

    expect(getFolder(tree_2, '2_4').status).toEqual('checked')
    // and test children while we're at it
    expect(getFolder(tree_2, '2_4_1').status).toEqual('checked')
    expect(getFolder(tree_2, '2_4_2').status).toEqual('checked')
    expect(getFolder(tree_2, '2_4_3').status).toEqual('checked')

    // 3. click on 2_4, thus making 2_4 "unchecked"
    const tree_3 = afterToggleCheckbox(tree_2, ['2_4'], () => null)

    expect(getFolder(tree_3, '2_4').status).toEqual('unchecked')
    // and test children while we're at it
    expect(getFolder(tree_3, '2_4_1').status).toEqual('unchecked')
    expect(getFolder(tree_3, '2_4_2').status).toEqual('unchecked')
    expect(getFolder(tree_3, '2_4_3').status).toEqual('unchecked')
  })

  it('old partialTree is NOT mutated', () => {
    const oldPartialTreeCopy = JSON.parse(JSON.stringify(oldPartialTree));
    afterToggleCheckbox(oldPartialTree, ['2_4_1'], () => null);
    expect(oldPartialTree).toEqual(oldPartialTreeCopy);
  })
})

describe('afterClickOnFolder', () => {
  it('open "checked" folder - all discovered files are marked as "checked"', () => {
    const oldPartialTree : PartialTree = [
      _root('ourRoot'),
          _folder('1', { parentId: 'ourRoot' }),
          _folder('2', { parentId: 'ourRoot', cached: false, status: 'checked' }),
    ]

    const fakeCompanionFiles = [{ requestPath: '666', isFolder: true }, { requestPath: '777', isFolder: false }, { requestPath: '888', isFolder: false }] as CompanionFile[]

    const clickedFolder = oldPartialTree.find((f) => f.id === '2') as PartialTreeFolderNode

    const newTree = afterClickOnFolder(oldPartialTree, fakeCompanionFiles, clickedFolder, () => null, null)

    expect(getFolder(newTree, '666').status).toEqual('checked')
    expect(getFile(newTree, '777').status).toEqual('checked')
    expect(getFile(newTree, '888').status).toEqual('checked')
  })

  it('open "unchecked" folder - all discovered files are marked as "unchecked"', () => {
    const oldPartialTree : PartialTree = [
      _root('ourRoot'),
          _folder('1', { parentId: 'ourRoot' }),
          _folder('2', { parentId: 'ourRoot', cached: false, status: 'unchecked' }),
    ]

    const fakeCompanionFiles = [{ requestPath: '666', isFolder: true }, { requestPath: '777', isFolder: false }, { requestPath: '888', isFolder: false }] as CompanionFile[]

    const clickedFolder = oldPartialTree.find((f) => f.id === '2') as PartialTreeFolderNode

    const newTree = afterClickOnFolder(oldPartialTree, fakeCompanionFiles, clickedFolder, () => null, null)

    expect(getFolder(newTree, '666').status).toEqual('unchecked')
    expect(getFile(newTree, '777').status).toEqual('unchecked')
    expect(getFile(newTree, '888').status).toEqual('unchecked')
  })
})
