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
  const discoveredFolders = discoveredItems.filter((i) => i.isFolder === true)
  const discoveredFiles = discoveredItems.filter((i) => i.isFolder === false)

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

  // Avoid duplicates when the user navigates to a child first (e.g. via search)
  // and then opens its parent. In that flow, the child node may already exist
  // under the parent before we fetch the parent's listing. Deduplicate by id
  // and prefer freshly discovered items from the current request.
  const idsToInsertArr = folders.map((f) => f.id).concat(files.map((f) => f.id))
  const idsToInsert = new Set(idsToInsertArr)

  const resultTree: PartialTree = []
  for (let i = 0; i < partialTreeWithUpdatedClickedFolder.length; i += 1) {
    const node = partialTreeWithUpdatedClickedFolder[i]
    if (typeof node.id === 'string' && idsToInsert.has(node.id)) continue
    resultTree.push(node)
  }
  for (let i = 0; i < folders.length; i += 1) {
    resultTree.push(folders[i])
  }
  for (let i = 0; i < files.length; i += 1) {
    resultTree.push(files[i])
  }
  return resultTree
}

export default afterOpenFolder
