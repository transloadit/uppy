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

  let breadcrumbs: PartialTreeFolder[] = []
  while (true) {
    breadcrumbs = [folder, ...breadcrumbs]

    if (folder.type === 'root') break
    const currentParentId = (folder as PartialTreeFolderNode).parentId
    folder = partialTree.find(
      (f) => f.id === currentParentId,
    ) as PartialTreeFolder
  }

  return breadcrumbs
}

export default getBreadcrumbs
