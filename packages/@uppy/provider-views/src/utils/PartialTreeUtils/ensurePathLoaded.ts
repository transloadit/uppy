import type { PartialTree, PartialTreeFile, PartialTreeFolder, PartialTreeFolderNode, PartialTreeId } from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'
import afterOpenFolder from './afterOpenFolder.js'

export type ApiList = (directory: PartialTreeId) => Promise<{
  nextPagePath: PartialTreeId
  items: CompanionFile[]
}>

/**
 * Given a folder id that may be prefixed with a search container
 * (e.g. "<scope>/__search__/%2Farch%2Frolling_release%2Fpatternfly"),
 * ensure the underlying path exists in the PartialTree by progressively
 * fetching each missing ancestor using apiList and afterOpenFolder.
 *
 * Returns the cleaned real target id (without the /__search__ prefix)
 * and the updated partialTree.
 */
export async function ensurePathLoaded(
  partialTree: PartialTree,
  rawId: PartialTreeId,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
): Promise<{ partialTree: PartialTree; targetId: PartialTreeId }>
{
  // Guard: null id means root; nothing to materialize
  if (!rawId) return { partialTree, targetId: rawId }

  // 1) Strip search container prefix if present: take tail after '/__search__/'
  const normalizedTargetId: string = rawId.includes('/__search__/')
    ? rawId.split('/__search__/')[1]
    : rawId

  let tree = partialTree

  // If the full target already exists, we still want to ensure its first page is listed
  // so avoid returning early here.

  // 2) Walk upwards to find deepest existing ancestor folder
  // Path components are encoded with slashes (%2F). We'll progressively trim
  // by removing the last "/<segment>" piece.
  const decodeForSegments = decodeURIComponent(normalizedTargetId)
  // Ensure leading slash for consistent slicing
  const cleanPath = decodeForSegments.startsWith('/') ? decodeForSegments : `/${decodeForSegments}`

  // Build candidate ancestors from deepest to root of this path
  const segments = cleanPath.split('/').filter(Boolean) // ["arch","rolling_release","patternfly"]
  const candidates: PartialTreeId[] = []
  for (let i = segments.length; i >= 1; i -= 1) {
    const path = `/${segments.slice(0, i).join('/')}`
    candidates.push(encodeURIComponent(path))
  }

  // Find the first existing ancestor in the partial tree
  let existingAncestorId: PartialTreeId | null = null
  let existingAncestor: PartialTreeFolder | undefined
  for (const cand of candidates) {
    const node = tree.find((n) => n.id === cand) as PartialTreeFolder | undefined
    if (node) {
      existingAncestorId = cand
      existingAncestor = node
      break
    }
  }

  // If no ancestor found, fall back to root folder in the tree
  if (!existingAncestorId || !existingAncestor) {
    existingAncestor = tree.find((n) => n.type === 'root') as PartialTreeFolder
    existingAncestorId = existingAncestor?.id ?? null
  }

  if (!existingAncestor || !existingAncestorId) {
    // Nothing we can do
    return { partialTree: tree, targetId: normalizedTargetId }
  }

  // 3) Progressively fetch forward from the existing ancestor towards the target
  // We iterate the remaining path pieces from the ancestor onwards
  const ancestorDecoded = decodeURIComponent(existingAncestorId)
  const ancestorSegments = ancestorDecoded.split('/').filter(Boolean)
  const remainingSegments = segments.slice(ancestorSegments.length)

  let currentFolder = existingAncestor as PartialTreeFolder

  // Starting from the ancestor, ensure each level is fetched once
  for (let idx = 0; idx < remainingSegments.length; idx += 1) {
    const pathSoFarDecoded = `/${segments.slice(0, ancestorSegments.length + idx + 1).join('/')}`
    const childId = encodeURIComponent(pathSoFarDecoded)

    let child = tree.find((n) => n.id === childId) as PartialTreeFolder | undefined

    if (!child) {
      // Need to fetch currentFolder to reveal its children
      const toList = currentFolder.cached ? currentFolder.nextPagePath : currentFolder.id
      let items: CompanionFile[] = []
      let page: PartialTreeId | null = toList
      while (page) {
        const { items: pageItems, nextPagePath } = await apiList(page)
        items = items.concat(pageItems)
        page = nextPagePath
      }

      // Merge children and mark folder cached
      tree = afterOpenFolder(tree, items, currentFolder, null, validateSingleFile)

      // Lookup again now that children exist
      child = tree.find((n) => n.id === childId) as PartialTreeFolder | undefined
      if (!child) {
        // If still missing, it might be a permission or case mismatch; abort
        break
      }
    }

    currentFolder = child
  }

  // 4) Ensure the target folder itself has its first page listed so it isn't empty when opened
  const targetFolder = tree.find((n) => n.id === normalizedTargetId) as PartialTreeFolder | undefined
  if (targetFolder && targetFolder.type === 'folder') {
    // If it has not been listed yet (no children under it), fetch first page now
    const hasAnyChildren = tree.some(
      (n) => n.type !== 'root' && (n as PartialTreeFile | PartialTreeFolderNode).parentId === targetFolder.id,
    )
    if (!hasAnyChildren || targetFolder.cached === false) {
      const { items, nextPagePath } = await apiList(targetFolder.id)
      tree = afterOpenFolder(tree, items, targetFolder, nextPagePath, validateSingleFile)
    }
  }

  return { partialTree: tree, targetId: normalizedTargetId }
}

export default ensurePathLoaded
