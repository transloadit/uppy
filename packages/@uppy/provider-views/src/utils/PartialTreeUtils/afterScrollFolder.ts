import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'

const afterScrollFolder = (
  oldPartialTree: PartialTree,
  currentFolderId: PartialTreeId,
  items: CompanionFile[],
  nextPagePath: string | null,
  validateSingleFile: (file: CompanionFile) => string | null,
): PartialTree => {
  const currentFolder = oldPartialTree.find(
    (i) => i.id === currentFolderId,
  ) as PartialTreeFolder

  const newFolders = items.filter((i) => i.isFolder === true)
  const newFiles = items.filter((i) => i.isFolder === false)

  // just doing `scrolledFolder.nextPagePath = ...` in a non-mutating way
  const scrolledFolder: PartialTreeFolder = { ...currentFolder, nextPagePath }
  const partialTreeWithUpdatedScrolledFolder = oldPartialTree.map((folder) =>
    folder.id === scrolledFolder.id ? scrolledFolder : folder,
  )
  const isParentFolderChecked =
    scrolledFolder.type === 'folder' && scrolledFolder.status === 'checked'
  const folders: PartialTreeFolderNode[] = newFolders.map((folder) => ({
    type: 'folder',
    id: folder.requestPath,

    cached: false,
    nextPagePath: null,

    status: isParentFolderChecked ? 'checked' : 'unchecked',
    parentId: scrolledFolder.id,
    data: folder,
  }))
  const files: PartialTreeFile[] = newFiles.map((file) => {
    const restrictionError = validateSingleFile(file)
    return {
      type: 'file',
      id: file.requestPath,

      restrictionError,

      status:
        isParentFolderChecked && !restrictionError ? 'checked' : 'unchecked',
      parentId: scrolledFolder.id,
      data: file,
    }
  })

  // Prevent duplicate children for this folder across pagination by
  // removing any nodes that share ids with the freshly fetched batch.
  const idsToInsertArr = folders.map((f) => f.id).concat(files.map((f) => f.id))
  const idsToInsert = new Set<string>(idsToInsertArr as string[])

  const resultTree: PartialTree = []
  for (let i = 0; i < partialTreeWithUpdatedScrolledFolder.length; i += 1) {
    const node = partialTreeWithUpdatedScrolledFolder[i]
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

export default afterScrollFolder
