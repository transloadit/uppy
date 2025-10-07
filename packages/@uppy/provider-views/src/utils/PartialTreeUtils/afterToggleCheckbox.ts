import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core'
import shallowClone from './shallowClone.js'

/*
  FROM        | TO

  root        |  root
    folder    |    folder
    folder ✅︎  |    folder ✅︎
      file    |      file ✅︎
      file    |      file ✅︎
      folder  |      folder ✅︎
        file  |        file ✅︎
    file      |    file
    file      |    file
*/
export const percolateDown = (
  tree: PartialTree,
  id: PartialTreeId,
  shouldMarkAsChecked: boolean,
) => {
  const children = tree.filter(
    (item) => item.type !== 'root' && item.parentId === id,
  ) as (PartialTreeFolderNode | PartialTreeFile)[]
  children.forEach((item) => {
    item.status =
      shouldMarkAsChecked && !(item.type === 'file' && item.restrictionError)
        ? 'checked'
        : 'unchecked'
    percolateDown(tree, item.id, shouldMarkAsChecked)
  })
}

/*
  FROM         | TO

  root         |  root
    folder     |    folder
    folder     |    folder [▬] ('partial' status)
      file     |      file
      folder   |      folder ✅︎
        file ✅︎ |       file ✅︎
    file       |    file
    file       |    file
*/
export const percolateUp = (tree: PartialTree, id: PartialTreeId) => {
  const folder = tree.find((item) => item.id === id) as PartialTreeFolder
  if (folder.type === 'root') return

  const validChildren = tree.filter(
    (item) =>
      // is a child
      item.type !== 'root' &&
      item.parentId === folder.id &&
      // does pass validations
      !(item.type === 'file' && item.restrictionError),
  ) as (PartialTreeFile | PartialTreeFolderNode)[]

  const areAllChildrenChecked = validChildren.every(
    (item) => item.status === 'checked',
  )
  const areAllChildrenUnchecked = validChildren.every(
    (item) => item.status === 'unchecked',
  )

  /**
   * We should not set a parent folder to checked/unchecked if it’s not cached yet.
   * Otherwise, it could cause a bug where checking a nested folder from the Search View
   * also marks its parent as checked.
   */

  /**
   * BUG: → /foo/bar/new/myfolder
   * If we search for "myfolder", we only build the minimal path (using ProviderView.#buildPath)
   * up to that folder adding nodes for "bar", "new", and "myfolder" (assuming "foo" is already
   * present in the partialTree as part of the root folder).
   * Since "foo", "bar", and "new" aren’t fully fetched yet, we don’t know if they have other children.
   * If the user checks "myfolder" from the search results and we propagate the checked state
   * upward without verifying parent.cached, it would incorrectly mark all its parents as checked.
   * Later, when the user navigates to any of "foo" , "bar" , "new" through the Normal View (via breadcrumbs or manually),
   * PartialTreeUtils.afterOpenFolder would mark and display all its children as checked.
   */

  if (areAllChildrenChecked && folder.cached) {
    folder.status = 'checked'
  } else if (areAllChildrenUnchecked && folder.cached) {
    folder.status = 'unchecked'
  } else {
    folder.status = 'partial'
  }

  percolateUp(tree, folder.parentId)
}

const afterToggleCheckbox = (
  oldTree: PartialTree,
  clickedRange: string[],
): PartialTree => {
  const tree: PartialTree = shallowClone(oldTree)

  if (clickedRange.length >= 2) {
    // We checked two or more items
    const newlyCheckedItems = tree.filter(
      (item) => item.type !== 'root' && clickedRange.includes(item.id),
    ) as (PartialTreeFile | PartialTreeFolderNode)[]

    newlyCheckedItems.forEach((item) => {
      if (item.type === 'file') {
        item.status = item.restrictionError ? 'unchecked' : 'checked'
      } else {
        item.status = 'checked'
      }
    })

    newlyCheckedItems.forEach((item) => {
      percolateDown(tree, item.id, true)
    })
    percolateUp(tree, newlyCheckedItems[0].parentId)
  } else {
    // We checked exactly one item
    const clickedItem = tree.find((item) => item.id === clickedRange[0]) as
      | PartialTreeFile
      | PartialTreeFolderNode
    clickedItem.status =
      clickedItem.status === 'checked' ? 'unchecked' : 'checked'
    percolateDown(tree, clickedItem.id, clickedItem.status === 'checked')
    percolateUp(tree, clickedItem.parentId)
  }
  return tree
}

export default afterToggleCheckbox
