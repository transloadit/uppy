/* eslint-disable no-param-reassign */
import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
} from '@uppy/core/lib/Uppy'
import clone from './clone'

const afterToggleCheckbox = (
  oldPartialTree: PartialTree,
  clickedRange: string[],
): PartialTree => {
  const newPartialTree: PartialTree = clone(oldPartialTree)
  const ourItem = newPartialTree.find((item) => item.id === clickedRange[0]) as
    | PartialTreeFile
    | PartialTreeFolderNode

  const percolateDown = (
    clickedItem: PartialTreeFolderNode | PartialTreeFile,
    isParentFolderChecked: boolean,
  ) => {
    const children = newPartialTree.filter(
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
      percolateDown(item, isParentFolderChecked)
    })
  }

  const percolateUp = (
    currentItem: PartialTreeFolderNode | PartialTreeFile,
  ) => {
    const parentFolder = newPartialTree.find(
      (item) => item.id === currentItem.parentId,
    )! as PartialTreeFolder
    if (parentFolder.type === 'root') return

    const validChildren = newPartialTree.filter(
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

    percolateUp(parentFolder)
  }

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
      percolateDown(item, true)
    })
    percolateUp(ourItem)
  } else {
    const oldStatus = (
      oldPartialTree.find((item) => item.id === clickedRange[0]) as
        | PartialTreeFile
        | PartialTreeFolderNode
    ).status
    ourItem.status = oldStatus === 'checked' ? 'unchecked' : 'checked'
    percolateDown(ourItem, ourItem.status === 'checked')
    percolateUp(ourItem)
  }

  return newPartialTree
}

export default afterToggleCheckbox
