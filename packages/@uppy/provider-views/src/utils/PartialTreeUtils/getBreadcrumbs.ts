import type {
  PartialTree,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core/lib/Uppy'

const getBreadcrumbs = (
  partialTree: PartialTree,
  currentFolderId: PartialTreeId,
): PartialTreeFolder[] => {
  if (!currentFolderId) return []

  let breadcrumbs: PartialTreeFolder[] = []

  let parent = partialTree.find(
    (folder) => folder.id === currentFolderId,
  ) as PartialTreeFolder
  while (parent.type !== 'root') {
    breadcrumbs = [parent, ...breadcrumbs]
    const currentParentId = (parent as PartialTreeFolderNode).parentId
    parent = partialTree.find(
      (folder) => folder.id === currentParentId,
    ) as PartialTreeFolder
  }

  return breadcrumbs.toReversed()
}

export default getBreadcrumbs
