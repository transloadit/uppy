import { describe, expect, it } from 'vitest'
import afterToggleCheckbox from './afterToggleCheckbox.ts'
import type { PartialTree, PartialTreeFile, PartialTreeFolderNode, PartialTreeFolderRoot } from '@uppy/core/lib/Uppy.ts'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'

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

const getFolder = (tree: PartialTree, id: string) =>
  tree.find((i) => i.id === id) as PartialTreeFolderNode
const getFile = (tree: PartialTree, id: string) =>
  tree.find((i) => i.id === id) as PartialTreeFile

describe('afterToggleCheckbox', () => {
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
})
