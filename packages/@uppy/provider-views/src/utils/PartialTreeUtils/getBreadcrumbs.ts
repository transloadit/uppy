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
    const rootFolder = partialTree.find(
      (f) => f.type === 'root',
    ) as PartialTreeFolder
    return rootFolder ? [rootFolder] : []
  }

  // Special-case: When the current folder is the artificial search container,
  // we want breadcrumbs to reflect the scope we searched in, e.g.
  // Root / some/folder / Search Results
  // Even though the search container is modeled as a sibling in the tree,
  // not as a child of the base scope.
  if (
    folder &&
    typeof folder.id === 'string' &&
    folder.id.endsWith('/__search__')
  ) {
    // Derive the base context id by stripping the '/__search__' suffix
    const baseIdRaw = folder.id.replace(/\/__search__$/, '')
    const baseId: PartialTreeId =
      baseIdRaw === '' || baseIdRaw === 'null'
        ? null
        : (baseIdRaw as PartialTreeId)

    // Find the base context node (or fall back to root)
    const baseNode =
      baseId == null
        ? (partialTree.find((f) => f.type === 'root') as PartialTreeFolder)
        : (partialTree.find((f) => f.id === baseId) as PartialTreeFolder)

    if (!baseNode) {
      // If we somehow can't find the base, fall back to default chain from current node
      console.warn(
        `Base context ${String(baseId)} not found for search breadcrumbs; falling back`,
      )
    } else {
      // Build breadcrumbs up to the base node
      const chain: PartialTreeFolder[] = []
      let cur: PartialTreeFolder | undefined = baseNode
      while (cur) {
        chain.unshift(cur)
        if (cur.type === 'root') break
        const parentId = (cur as PartialTreeFolderNode).parentId
        cur = partialTree.find((f) => f.id === parentId) as PartialTreeFolder
        if (!cur) {
          console.warn(
            `Parent folder ${parentId} not found, breaking breadcrumb chain`,
          )
          break
        }
      }
      // Append the search container as the last segment
      return [...chain, folder]
    }
  }

  let breadcrumbs: PartialTreeFolder[] = []
  while (folder) {
    breadcrumbs = [folder, ...breadcrumbs]

    if (folder.type === 'root') break
    const parentId = (folder as PartialTreeFolderNode).parentId
    folder = partialTree.find((f) => f.id === parentId) as PartialTreeFolder

    // If parent folder is not found, break to avoid infinite loop
    if (!folder) {
      console.warn(
        `Parent folder ${parentId} not found, breaking breadcrumb chain`,
      )
      break
    }
  }

  return breadcrumbs
}

export default getBreadcrumbs
