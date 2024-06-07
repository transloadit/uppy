/* eslint-disable no-param-reassign */
import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
} from '@uppy/core/lib/Uppy'
import clone from './clone'

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
const percolateDown = (
  tree: PartialTree,
  clickedItem: PartialTreeFolderNode | PartialTreeFile,
  isParentFolderChecked: boolean,
) => {
  const children = tree.filter(
    (item) => item.type !== 'root' && item.parentId === clickedItem.id,
  ) as (PartialTreeFolderNode | PartialTreeFile)[]
  children.forEach((item) => {
    if (item.type === 'file') {
      item.status =
        isParentFolderChecked && !item.restrictionError ?
          'checked'
        : 'unchecked'
    } else {
      item.status = isParentFolderChecked ? 'checked' : 'unchecked'
    }
    percolateDown(tree, item, isParentFolderChecked)
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
const percolateUp = (
  tree: PartialTree,
  currentItem: PartialTreeFolderNode | PartialTreeFile,
) => {
  const parentFolder = tree.find(
    (item) => item.id === currentItem.parentId,
  )! as PartialTreeFolder
  if (parentFolder.type === 'root') return

  const validChildren = tree.filter(
    (item) =>
      // is a child
      item.type !== 'root' &&
      item.parentId === parentFolder.id &&
      // does pass validations
      !(item.type === 'file' && item.restrictionError),
  ) as (PartialTreeFile | PartialTreeFolderNode)[]
  const areAllChildrenChecked = validChildren.every(
    (item) => item.status === 'checked',
  )
  const areAllChildrenUnchecked = validChildren.every(
    (item) => item.status === 'unchecked',
  )

  if (areAllChildrenChecked) {
    parentFolder.status = 'checked'
  } else if (areAllChildrenUnchecked) {
    parentFolder.status = 'unchecked'
  } else {
    parentFolder.status = 'partial'
  }

  percolateUp(tree, parentFolder)
}

const afterToggleCheckbox = (
  oldPartialTree: PartialTree,
  clickedRange: string[],
): PartialTree => {
  const newPartialTree: PartialTree = clone(oldPartialTree)

  // We checked two or more items
  if (clickedRange.length >= 2) {
    const newlyCheckedItems = newPartialTree.filter(
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
      percolateDown(newPartialTree, item, true)
    })
    percolateUp(newPartialTree, newlyCheckedItems[0])
    // We checked exactly one item
  } else {
    const clickedItem = newPartialTree.find(
      (item) => item.id === clickedRange[0],
    ) as PartialTreeFile | PartialTreeFolderNode
    clickedItem.status =
      clickedItem.status === 'checked' ? 'unchecked' : 'checked'
    percolateDown(newPartialTree, clickedItem, clickedItem.status === 'checked')
    percolateUp(newPartialTree, clickedItem)
  }

  return newPartialTree
}

export default afterToggleCheckbox
