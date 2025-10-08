import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'

const afterOpenFolder = (
  oldPartialTree: PartialTree,
  discoveredItems: CompanionFile[],
  clickedFolder: PartialTreeFolder,
  currentPagePath: string | null,
  validateSingleFile: (file: CompanionFile) => string | null,
): PartialTree => {
  // Filter out existing items in the partial tree (we don't want duplicates)
  // If we don't, we would get a duplicate when the item is already added to the partial tree in the search view
  // and the user then enters its parent from the normal view e.g either through breadcrumbs or manually navigating to it.
  const discoveredUniqueItems = discoveredItems.filter(
    (i) => !oldPartialTree.find((f) => f.id === i.requestPath),
  )
  const discoveredFolders = discoveredUniqueItems.filter(
    (i) => i.isFolder === true,
  )
  const discoveredFiles = discoveredUniqueItems.filter(
    (i) => i.isFolder === false,
  )

  const isParentFolderChecked =
    clickedFolder.type === 'folder' && clickedFolder.status === 'checked'
  const folders: PartialTreeFolderNode[] = discoveredFolders.map((folder) => ({
    type: 'folder',
    id: folder.requestPath,
    cached: false,
    nextPagePath: null,
    status: isParentFolderChecked ? 'checked' : 'unchecked',
    parentId: clickedFolder.id,
    data: folder,
  }))
  const files: PartialTreeFile[] = discoveredFiles.map((file) => {
    const restrictionError = validateSingleFile(file)
    return {
      type: 'file',
      id: file.requestPath,

      restrictionError,

      status:
        isParentFolderChecked && !restrictionError ? 'checked' : 'unchecked',
      parentId: clickedFolder.id,
      data: file,
    }
  })

  // just doing `clickedFolder.cached = true` in a non-mutating way
  const updatedClickedFolder: PartialTreeFolder = {
    ...clickedFolder,
    cached: true,
    nextPagePath: currentPagePath,
  }
  const partialTreeWithUpdatedClickedFolder = oldPartialTree.map((folder) =>
    folder.id === updatedClickedFolder.id ? updatedClickedFolder : folder,
  )

  const newPartialTree = [
    ...partialTreeWithUpdatedClickedFolder,
    ...folders,
    ...files,
  ]
  return newPartialTree
}

export default afterOpenFolder
