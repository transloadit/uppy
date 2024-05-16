import type { PartialTree, PartialTreeFile, PartialTreeFolder, PartialTreeFolderNode } from "@uppy/core/lib/Uppy"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"
import clone from "./clone"

const afterToggleCheckbox = (
  oldPartialTree: PartialTree,
  clickedRange: string[],
  validateSingleFile: (file: CompanionFile) => string | null,
) : PartialTree => {
  const newPartialTree : PartialTree = clone(oldPartialTree)
  const ourItem = newPartialTree.find((item) => item.id === clickedRange[0]) as PartialTreeFile | PartialTreeFolderNode

  const percolateDown = (clickedItem: PartialTreeFolderNode | PartialTreeFile, isParentFolderChecked: Boolean) => {
    const children = newPartialTree.filter((item) => item.type !== 'root' && item.parentId === clickedItem.id) as (PartialTreeFolderNode | PartialTreeFile)[]
    children.forEach((item) => {
      if (item.type === 'file') {
        item.status = isParentFolderChecked && !item.restrictionError ? 'checked' : 'unchecked'
      } else {
        item.status = isParentFolderChecked ? 'checked' : 'unchecked'
      }
      percolateDown(item, isParentFolderChecked)
    })
  }
  // we do something to all of its parents.
  const percolateUp = (currentItem: PartialTreeFolderNode | PartialTreeFile) => {
    const parentFolder = newPartialTree.find((item) => item.id === currentItem.parentId)! as PartialTreeFolder
    if (parentFolder.type === 'root') return

    const parentsChildren = newPartialTree.filter((item) => item.type !== 'root' && item.parentId === parentFolder.id) as (PartialTreeFile | PartialTreeFolderNode)[]
    const parentsValidChildren = parentsChildren.filter((item) =>
      !validateSingleFile(item.data)
    )
    const areAllChildrenChecked = parentsValidChildren.every((item) => item.status === 'checked')
    const areAllChildrenUnchecked = parentsValidChildren.every((item) => item.status === 'unchecked')

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
    const newlyCheckedItems = newPartialTree
      .filter((item) => item.type !== 'root' && clickedRange.includes(item.id)) as (PartialTreeFile | PartialTreeFolderNode)[] 

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
    const oldStatus = (oldPartialTree.find((item) => item.id === clickedRange[0]) as PartialTreeFile | PartialTreeFolderNode).status
    ourItem.status = oldStatus === 'checked' ? 'unchecked' : 'checked'
    percolateDown(ourItem, ourItem.status === 'checked')
    percolateUp(ourItem)
  }

  return newPartialTree
}

export default afterToggleCheckbox
