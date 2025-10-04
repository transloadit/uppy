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
  console.log("inside afterOpenFolder called with partialTree ---> ", oldPartialTree)
  console.log("inside afterOpenFolder called with discoveredItems ---> ", discoveredItems)
  console.log("inside afterOpenFolder called with clickedFolder ---> ", clickedFolder)

  const discoveredFolders = discoveredItems.filter((i) => i.isFolder === true && !oldPartialTree.find((f) => f.id === i.requestPath))

  console.log("logging discoveredFolders inside afterOpenFolder ---> ", discoveredFolders)
  const discoveredFiles = discoveredItems.filter((i) => i.isFolder === false && !oldPartialTree.find((f) => f.id === i.requestPath))

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
