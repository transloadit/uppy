import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
} from '../../../index.js'
import type { CompanionFile } from '../../../utils/index.js'

/**
 * Appends a listing of `folder` to the tree, folders first, each in listing order.
 *
 * Search results and deep links add a folder's descendants (with their ancestors) before the
 * folder itself is listed. Such an item takes its listed position and data, keeping its state, so
 * it neither appears out of order nor twice. An item that is already elsewhere in the tree stays
 * where it is.
 */
const addListedItems = (
  partialTree: PartialTree,
  items: CompanionFile[],
  folder: PartialTreeFolder,
  validateSingleFile: (file: CompanionFile) => string | null,
): PartialTree => {
  const known = new Map(partialTree.map((node) => [node.id, node]))
  const moved = new Set<PartialTreeId>()
  const isParentFolderChecked =
    folder.type === 'folder' && folder.status === 'checked'

  const folders: PartialTreeFolderNode[] = items
    .filter((item) => item.isFolder === true)
    .flatMap((item) => {
      const existing = known.get(item.requestPath)
      if (existing === undefined) {
        return [
          {
            type: 'folder',
            id: item.requestPath,
            cached: false,
            nextPagePath: null,
            status: isParentFolderChecked ? 'checked' : 'unchecked',
            parentId: folder.id,
            data: item,
          },
        ]
      }
      if (existing.type !== 'folder' || existing.parentId !== folder.id) {
        return []
      }
      moved.add(existing.id)
      return [{ ...existing, data: item }]
    })
  const files: PartialTreeFile[] = items
    .filter((item) => item.isFolder === false)
    .flatMap((item) => {
      const existing = known.get(item.requestPath)
      if (existing === undefined) {
        const restrictionError = validateSingleFile(item)
        return [
          {
            type: 'file',
            id: item.requestPath,
            restrictionError,
            status:
              isParentFolderChecked && !restrictionError
                ? 'checked'
                : 'unchecked',
            parentId: folder.id,
            data: item,
          },
        ]
      }
      if (existing.type !== 'file' || existing.parentId !== folder.id) {
        return []
      }
      moved.add(existing.id)
      return [{ ...existing, data: item }]
    })

  return [
    ...partialTree.filter((node) => !moved.has(node.id)),
    ...folders,
    ...files,
  ]
}

export default addListedItems
