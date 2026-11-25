import type {
  PartialTree,
  PartialTreeFolder,
  PartialTreeId,
} from '../../../index.js'
import type { CompanionFile } from '../../../utils/index.js'

import addListedItems, { showUnlistedLast } from './addListedItems.js'

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

  // just doing `scrolledFolder.nextPagePath = ...` in a non-mutating way
  const scrolledFolder: PartialTreeFolder = { ...currentFolder, nextPagePath }
  const partialTreeWithUpdatedScrolledFolder = oldPartialTree.map((folder) =>
    folder.id === scrolledFolder.id ? scrolledFolder : folder,
  )

  return showUnlistedLast(
    addListedItems(
      partialTreeWithUpdatedScrolledFolder,
      items,
      scrolledFolder,
      validateSingleFile,
    ),
    scrolledFolder.id,
  )
}

export default afterScrollFolder
