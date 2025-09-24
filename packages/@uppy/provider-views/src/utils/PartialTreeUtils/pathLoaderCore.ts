// Path loading core utilities
//
// These helpers centralize the common logic for:
// - Normalizing ids that may be prefixed by a search container
// - Finding the deepest ancestor already present in the PartialTree
// - Walking down the path and revealing missing children (with pagination)
// - Optionally ensuring the target folder has its first page listed
//
// Contract (at a glance):
// - PartialTree is a flat list of nodes; ids are URL-encoded paths (e.g. "%2Ffoo%2Fbar")
// - ApiList(directory) returns { items, nextPagePath } and supports pagination
// - afterOpenFolder merges fetched items under a folder and updates cache flags
//


import type { PartialTree, PartialTreeFolder, PartialTreeFolderNode, PartialTreeId } from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'
import afterOpenFolder from './afterOpenFolder.js'

// Shared ApiList type
/**
 * List API contract used by the path loaders.
 * directory: encoded path id (or a nextPagePath cursor)
 * returns: a page of items and a nextPagePath cursor (or null)
 */
export type ApiList = (directory: PartialTreeId) => Promise<{
  nextPagePath: PartialTreeId
  items: CompanionFile[]
}>

/**
 * Remove the artificial search container prefix so we operate on real paths.
 *
 * Example:
 *   "/scope/__search__/%2Fprojects%2FclientA" → "%2Fprojects%2FclientA"
 *
 * Diagram:
 *   /scope/__search__/ %2Fprojects%2FclientA
 *                        │
 *                        ▼
 *                %2Fprojects%2FclientA
 */
export function normalizeSearchTarget(rawId: PartialTreeId): string {
  if (!rawId) return rawId as unknown as string
  return rawId.includes('/__search__/')
    ? rawId.split('/__search__/')[1]
    : (rawId as string)
}

/**
 * Build a deepest→shallowest list of encoded ancestor candidate ids.
 *
 * Input: "%2Ffoo%2Fbar%2Fbaz"
 * Output: ["%2Ffoo%2Fbar%2Fbaz", "%2Ffoo%2Fbar", "%2Ffoo"]
 *
 * Diagram (decoded):
 *   /foo/bar/baz → [/foo/bar/baz, /foo/bar, /foo]
 */
export function buildEncodedAncestorCandidates(
  targetId: string,
): PartialTreeId[] {
  const decoded = decodeURIComponent(targetId)
  const clean = decoded.startsWith('/') ? decoded : `/${decoded}`
  const segs = clean.split('/').filter(Boolean)
  const candidates: PartialTreeId[] = []
  for (let i = segs.length; i >= 1; i -= 1) {
    const p = `/${segs.slice(0, i).join('/')}`
    candidates.push(encodeURIComponent(p))
  }
  return candidates
}

/**
 * Find the closest existing ancestor in the current PartialTree.
 * If none of the candidates exist, fall back to the root node.
 *
 * Example:
 *   candidates: [/foo/bar/baz, /foo/bar, /foo]
 *   tree has:   /foo, /foo/bar
 *   result:     /foo/bar
 */
export function findDeepestExistingAncestor(
  tree: PartialTree,
  candidates: PartialTreeId[],
): {
  ancestorId: PartialTreeId | null
  ancestor: PartialTreeFolder | undefined
} {
  let ancestorId: PartialTreeId | null = null
  let ancestor: PartialTreeFolder | undefined
  for (const cand of candidates) {
    const node = tree.find((n) => n.id === cand) as
      | PartialTreeFolder
      | undefined
    if (node) {
      ancestorId = cand
      ancestor = node
      break
    }
  }
  if (!ancestor || !ancestorId) {
    ancestor = tree.find((n) => n.type === 'root') as PartialTreeFolder
    ancestorId = ancestor?.id ?? null
  }
  return { ancestorId, ancestor }
}

/**
 * Fetch all pages starting at `start` and flatten the items list.
 * Used when revealing a folder's children may require pagination.
 */
async function listAllPages(
  apiList: ApiList,
  start: PartialTreeId | null,
): Promise<CompanionFile[]> {
  let items: CompanionFile[] = []
  let page: PartialTreeId | null = start
  while (page) {
    const { items: pageItems, nextPagePath } = await apiList(page)
    items = items.concat(pageItems)
    page = nextPagePath
  }
  return items
}

/**
 * Walk from a known ancestor down to the `targetId`, ensuring each missing
 * intermediate child is revealed (listing the current folder with pagination
 * when required). Merges results via afterOpenFolder.
 *
 * Example (decoded):
 *   want: /foo/bar/baz
 *   have: /foo/bar
 *     - ensure child "baz" exists under "bar"
 *     - if missing → list "bar" (all pages) → merge → retry → continue
 */
export async function walkAndEnsurePath(
  tree: PartialTree,
  ancestor: PartialTreeFolder,
  targetId: string,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
): Promise<PartialTree> {
  const decodedTarget = decodeURIComponent(targetId)
  const cleanPath = decodedTarget.startsWith('/')
    ? decodedTarget
    : `/${decodedTarget}`
  const segs = cleanPath.split('/').filter(Boolean)

  const ancestorDecoded = decodeURIComponent(ancestor.id as string)
  const ancestorSegs = ancestorDecoded.split('/').filter(Boolean)
  const remaining = segs.slice(ancestorSegs.length)

  let current = ancestor
  let workingTree = tree

  for (let idx = 0; idx < remaining.length; idx += 1) {
    const pathSoFarDecoded = `/${segs.slice(0, ancestorSegs.length + idx + 1).join('/')}`
    const childId = encodeURIComponent(pathSoFarDecoded)
    let child = workingTree.find((n) => n.id === childId) as
      | PartialTreeFolder
      | undefined
    if (!child) {
      // Need to list current to reveal children
      const toList = (current as PartialTreeFolder).cached
        ? (current as PartialTreeFolder).nextPagePath
        : current.id
      const items = await listAllPages(apiList, toList)
      workingTree = afterOpenFolder(
        workingTree,
        items,
        current,
        null,
        validateSingleFile,
      )
      child = workingTree.find((n) => n.id === childId) as
        | PartialTreeFolder
        | undefined
      if (!child) break
    }
    current = child
  }

  return workingTree
}

/**
 * Ensure the target folder won't render empty by listing its first page when:
 * - It has no children in the PartialTree yet, or
 * - It is explicitly marked as not cached.
 *
 */
export async function ensureTargetFirstPageIfNeeded(
  tree: PartialTree,
  targetId: string,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
): Promise<PartialTree> {
  const targetFolder = tree.find((n) => n.id === targetId) as
    | PartialTreeFolder
    | undefined
  if (targetFolder && targetFolder.type === 'folder') {
    const hasAnyChildren = tree.some(
      (n) =>
        n.type !== 'root' &&
        (n as PartialTreeFolderNode).parentId === targetFolder.id,
    )
    if (!hasAnyChildren || targetFolder.cached === false) {
      const { items, nextPagePath } = await apiList(targetFolder.id)
      return afterOpenFolder(
        tree,
        items,
        targetFolder,
        nextPagePath,
        validateSingleFile,
      )
    }
  }
  return tree
}

/**
 * Materialize a path into the PartialTree.
 *
 * Steps:
 * 1) normalizeSearchTarget (strip '/__search__/')
 * 2) buildEncodedAncestorCandidates (deep → shallow)
 * 3) findDeepestExistingAncestor (falls back to root)
 * 4) walkAndEnsurePath (list and reveal missing intermediates)
 * 5) optionally ensureTargetFirstPageIfNeeded (so target isn't empty)
 */
export async function materializePath(
  partialTree: PartialTree,
  rawId: PartialTreeId,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
  options: { includeTargetFirstPage: boolean },
): Promise<{ partialTree: PartialTree; targetId: PartialTreeId }> {
  if (!rawId) return { partialTree, targetId: rawId }

  const targetId = normalizeSearchTarget(rawId)

  // 2) Build candidates and locate deepest existing ancestor
  const candidates: PartialTreeId[] = buildEncodedAncestorCandidates(targetId)
  const { ancestorId, ancestor } = findDeepestExistingAncestor(partialTree, candidates)

  if (!ancestor || !ancestorId) return { partialTree, targetId }

  // 4) Walk forward to materialize intermediate segments
  let tree = await walkAndEnsurePath(partialTree, ancestor as PartialTreeFolder, targetId, apiList, validateSingleFile)

  // 5) Optionally ensure target's first page is listed
  if (options.includeTargetFirstPage) {
    tree = await ensureTargetFirstPageIfNeeded(tree, targetId, apiList, validateSingleFile)
  }

  return { partialTree: tree, targetId }
}
