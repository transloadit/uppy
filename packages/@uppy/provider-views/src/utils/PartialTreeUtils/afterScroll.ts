import type { PartialTree, PartialTreeFile, PartialTreeFolder, PartialTreeFolderNode } from "@uppy/core/lib/Uppy"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"

const afterScroll = (
  oldPartialTree: PartialTree,
  currentFolderId: string | null,
  items: CompanionFile[],
  nextPagePath: string | null,
  validateRestrictions: (file: CompanionFile) => object | null,
) : PartialTree => {
  const currentFolder = oldPartialTree.find((i) => i.id === currentFolderId) as PartialTreeFolder

  let newFolders = items.filter((i) => i.isFolder === true)
  let newFiles = items.filter((i) => i.isFolder === false)

  // just doing `scrolledFolder.nextPagePath = ...` in a non-mutating way
  const scrolledFolder : PartialTreeFolder = { ...currentFolder, nextPagePath }
  const partialTreeWithUpdatedScrolledFolder = oldPartialTree.map((folder) =>
    folder.id === scrolledFolder.id ? scrolledFolder : folder
  )
  const newlyAddedItemStatus = (scrolledFolder.type === 'folder' && scrolledFolder.status === 'checked') ? 'checked' : 'unchecked';
  const folders : PartialTreeFolderNode[] = newFolders.map((folder) => ({
    type: 'folder',
    id: folder.requestPath,

    cached: false,
    nextPagePath: null,

    status: newlyAddedItemStatus,
    parentId: scrolledFolder.id,
    data: folder,
  }))
  const files : PartialTreeFile[] = newFiles.map((file) => ({
    type: 'file',
    id: file.requestPath,

    status: newlyAddedItemStatus === 'checked' && validateRestrictions(file) ? 'unchecked' : newlyAddedItemStatus,
    parentId: scrolledFolder.id,
    data: file,
  }))

  const newPartialTree : PartialTree = [
    ...partialTreeWithUpdatedScrolledFolder,
    ...folders,
    ...files
  ]
  return newPartialTree
}

export default afterScroll
