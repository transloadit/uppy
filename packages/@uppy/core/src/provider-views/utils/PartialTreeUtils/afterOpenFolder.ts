import type { PartialTree, PartialTreeFolder } from '../../../index.js'
import type { CompanionFile } from '../../../utils/index.js'

import addListedItems from './addListedItems.js'

const afterOpenFolder = (
  oldPartialTree: PartialTree,
  discoveredItems: CompanionFile[],
  clickedFolder: PartialTreeFolder,
  currentPagePath: string | null,
  validateSingleFile: (file: CompanionFile) => string | null,
): PartialTree => {
  // just doing `clickedFolder.cached = true` in a non-mutating way
  const updatedClickedFolder: PartialTreeFolder = {
    ...clickedFolder,
    cached: true,
    nextPagePath: currentPagePath,
  }
  const partialTreeWithUpdatedClickedFolder = oldPartialTree.map((folder) =>
    folder.id === updatedClickedFolder.id ? updatedClickedFolder : folder,
  )

  const listed = addListedItems(
    partialTreeWithUpdatedClickedFolder,
    discoveredItems,
    updatedClickedFolder,
    validateSingleFile,
  )
  // Children added before this listing that it did not include are on a later page: show them
  // after the first one until that page moves them into place.
  const listedIds = new Set(discoveredItems.map((item) => item.requestPath))
  const isUnlistedChild = (node: PartialTree[number]) =>
    node.type !== 'root' &&
    node.parentId === clickedFolder.id &&
    !listedIds.has(node.id)
  return [
    ...listed.filter((node) => !isUnlistedChild(node)),
    ...listed.filter(isUnlistedChild),
  ]
}

export default afterOpenFolder
