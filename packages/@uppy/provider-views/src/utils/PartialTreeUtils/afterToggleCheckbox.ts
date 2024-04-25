import type { PartialTree, PartialTreeFile, PartialTreeFolder, PartialTreeFolderNode } from "@uppy/core/lib/Uppy"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"

const afterToggleCheckbox = (
  oldPartialTree: PartialTree,
  clickedRange: string[],
  validateRestrictions: (file: CompanionFile) => object | null,
) : PartialTree => {
  const newPartialTree : PartialTree = JSON.parse(JSON.stringify(oldPartialTree))
  const ourItemOld = oldPartialTree.find((item) => item.id === clickedRange[0]) as (PartialTreeFile | PartialTreeFolderNode)
  const ourItem = newPartialTree.find((item) => item.id === clickedRange[0]) as (PartialTreeFile | PartialTreeFolderNode)

  // if newStatus is "checked" - percolate down "checked"
  // if newStatus is "unchecked" - percolate down "unchecked"
  const percolateDown = (clickedItem: PartialTreeFolderNode | PartialTreeFile, status: 'checked' | 'unchecked') => {
    const children = newPartialTree.filter((item) => item.type !== 'root' && item.parentId === clickedItem.id) as (PartialTreeFolderNode | PartialTreeFile)[]
    children.forEach((item) => {
      if (item.type === 'file') {
        item.status = status === 'checked' && validateRestrictions(item.data) ? 'unchecked' : status
      } else {
        item.status = status
      }
      percolateDown(item, status)
    })
  }
  // we do something to all of its parents.
  const percolateUp = (currentItem: PartialTreeFolderNode | PartialTreeFile) => {
    const parentFolder = newPartialTree.find((item) => item.id === currentItem.parentId)! as PartialTreeFolder
    if (parentFolder.type === 'root') return

    const parentsChildren = newPartialTree.filter((item) => item.type !== 'root' && item.parentId === parentFolder.id) as (PartialTreeFile | PartialTreeFolderNode)[]
    const parentsValidChildren = parentsChildren.filter((item) =>
      !validateRestrictions(item.data)
    )
    const areAllChildrenChecked = parentsValidChildren.every((item) => item.status === "checked")
    const areAllChildrenUnchecked = parentsValidChildren.every((item) => item.status === "unchecked")

    if (areAllChildrenChecked) {
      parentFolder.status = "checked"
    } else if (areAllChildrenUnchecked) {
      parentFolder.status = "unchecked"
    } else {
      parentFolder.status = "partial"
    }

    percolateUp(parentFolder)
  }

  if (clickedRange.length >= 2) {
    const newlyCheckedItems = newPartialTree
      .filter((item) => item.type !== 'root' && clickedRange.includes(item.id)) as (PartialTreeFile | PartialTreeFolderNode)[] 

    newlyCheckedItems.forEach((item) => {
      if (item.type === 'file') {
        item.status = validateRestrictions(item.data) ? 'unchecked' : 'checked'
      } else {
        item.status = 'checked'
      }
    })

    newlyCheckedItems.forEach((item) => {
      percolateDown(item, 'checked')
    })
    percolateUp(ourItem)
  } else {
    ourItem.status = ourItemOld.status === 'checked' ? 'unchecked' : 'checked'
    percolateDown(ourItem, ourItem.status)
    percolateUp(ourItem)
  }

  return newPartialTree
}

export default afterToggleCheckbox
