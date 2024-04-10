import type { PartialTree, PartialTreeFile, PartialTreeFolder, PartialTreeFolderNode } from "@uppy/core/lib/Uppy"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"

const getPartialTreeAfterTogglingCheckboxes = (
  oldPartialTree: PartialTree,
  ourItem: PartialTreeFolderNode | PartialTreeFile,
  validateRestrictions: (file: CompanionFile) => object | null,
  filterItems : (items: PartialTree) => PartialTree,
  currentFolderId:  string | null,
  isShiftKeyPressed: boolean,
  lastCheckbox: string | undefined
) : PartialTree => {
  const newPartialTree : PartialTree = JSON.parse(JSON.stringify(oldPartialTree))

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

  // Shift-clicking selects a single consecutive list of items
  // starting at the previous click.
  const inThisFolder  = filterItems(newPartialTree.filter((item) => item.type !== 'root' && item.parentId === currentFolderId)) as (PartialTreeFile | PartialTreeFolderNode)[]
  const prevIndex = inThisFolder.findIndex((item) => item.id === lastCheckbox)
  if (prevIndex !== -1 && isShiftKeyPressed) {
    const newIndex = inThisFolder.findIndex((item) => item.id === ourItem.id)
    const toMarkAsChecked = (prevIndex < newIndex ?
        inThisFolder.slice(prevIndex, newIndex + 1)
      : inThisFolder.slice(newIndex, prevIndex + 1)
    ).map((item) => item.id)

    const newlyCheckedItems = newPartialTree
      .filter((item) => item.type !== 'root' && toMarkAsChecked.includes(item.id)) as (PartialTreeFile | PartialTreeFolderNode)[] 

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
    const ourItemInNewTree = newPartialTree.find((item) => item.id === ourItem.id) as (PartialTreeFile | PartialTreeFolderNode)
    ourItemInNewTree.status = ourItem.status === 'checked' ? 'unchecked' : 'checked'
    percolateDown(ourItem, ourItemInNewTree.status)
    percolateUp(ourItem)
  }

  return newPartialTree
}

const clickOnFolder = (
  oldPartialTree: PartialTree,
  currentItems: CompanionFile[],
  clickedFolder: PartialTreeFolder,
  validateRestrictions: (file: CompanionFile) => object | null,
  currentPagePath: string | null
) : PartialTree => {
  let newFolders = currentItems.filter((i) => i.isFolder === true)
  let newFiles = currentItems.filter((i) => i.isFolder === false)

  const newlyAddedItemStatus = (clickedFolder.type === 'folder' && clickedFolder.status === 'checked') ? 'checked' : 'unchecked';
  const folders : PartialTreeFolderNode[] = newFolders.map((folder) => ({
    type: 'folder',
    id: folder.requestPath,

    cached: false,
    nextPagePath: null,

    status: newlyAddedItemStatus,
    parentId: clickedFolder.id,
    data: folder,
  }))
  const files : PartialTreeFile[] = newFiles.map((file) => ({
    type: 'file',
    id: file.requestPath,

    status: newlyAddedItemStatus === 'checked' && validateRestrictions(file) ? 'unchecked' : newlyAddedItemStatus,
    parentId: clickedFolder.id,
    data: file,
  }))

  // just doing `clickedFolder.cached = true` in a non-mutating way
  const updatedClickedFolder : PartialTreeFolder = {
    ...clickedFolder,
    cached: true,
    nextPagePath: currentPagePath
  }
  const partialTreeWithUpdatedClickedFolder = oldPartialTree.map((folder) =>
    folder.id === updatedClickedFolder.id ?
      updatedClickedFolder :
      folder
  )

  const newPartialTree = [
    ...partialTreeWithUpdatedClickedFolder,
    ...folders,
    ...files
  ]
  return newPartialTree
}

export default { getPartialTreeAfterTogglingCheckboxes, clickOnFolder }
