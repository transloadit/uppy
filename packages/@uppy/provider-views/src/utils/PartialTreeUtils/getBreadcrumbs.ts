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
  // Try to locate the starting folder; if it doesn't exist (e.g., in a
  // synthetic search mode or after a state reset), fall back to the root.
  let folder = partialTree.find((f) => f.id === currentFolderId) as
    | PartialTreeFolder
    | undefined

  if (!folder) {
    folder = partialTree.find((f) => f.type === 'root') as
      | PartialTreeFolder
      | undefined
  }

  if (!folder) return []

  let breadcrumbs: PartialTreeFolder[] = []
  while (true) {
    breadcrumbs = [folder, ...breadcrumbs]

    if (folder.type === 'root') break
    const currentParentId = (folder as PartialTreeFolderNode).parentId
    folder = partialTree.find((f) => f.id === currentParentId) as
      | PartialTreeFolder
      | undefined
    if (!folder) break
  }

  return breadcrumbs
}

export default getBreadcrumbs
