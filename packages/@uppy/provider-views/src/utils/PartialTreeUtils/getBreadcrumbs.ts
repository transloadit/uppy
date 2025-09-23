import type {
  PartialTree,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core'

const getBreadcrumbs = (
  partialTree: PartialTree,
  currentFolderId: PartialTreeId,
): PartialTreeFolder[] => {
  let folder = partialTree.find(
    (f) => f.id === currentFolderId,
  ) as PartialTreeFolder

  // If folder is not found, return empty breadcrumbs or find root folder
  if (!folder) {
    console.warn(`Folder ${currentFolderId} not found in tree for breadcrumbs`)
    const rootFolder = partialTree.find((f) => f.type === 'root') as PartialTreeFolder
    return rootFolder ? [rootFolder] : []
  }

  let breadcrumbs: PartialTreeFolder[] = []
  while (folder) {
    breadcrumbs = [folder, ...breadcrumbs]

    if (folder.type === 'root') break
    const parentId = (folder as PartialTreeFolderNode).parentId
    folder = partialTree.find(
      (f) => f.id === parentId,
    ) as PartialTreeFolder
    
    // If parent folder is not found, break to avoid infinite loop
    if (!folder) {
      console.warn(`Parent folder ${parentId} not found, breaking breadcrumb chain`)
      break
    }
  }

  return breadcrumbs
}

export default getBreadcrumbs
