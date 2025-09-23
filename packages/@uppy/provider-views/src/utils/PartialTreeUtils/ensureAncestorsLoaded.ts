import type { PartialTree, PartialTreeFolder, PartialTreeId } from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'
import afterOpenFolder from './afterOpenFolder.js'

export type ApiList = (directory: PartialTreeId) => Promise<{
  nextPagePath: PartialTreeId
  items: CompanionFile[]
}>

/**
 * Ensure that a given target id (possibly prefixed with '/__search__/') has its
 * ancestors present in the PartialTree. It will iteratively fetch from the
 * deepest existing ancestor to reach the target node. It does NOT fetch the
 * target folder's contents.
 */
export async function ensureAncestorsLoaded(
  partialTree: PartialTree,
  rawId: PartialTreeId,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
): Promise<{ partialTree: PartialTree; targetId: PartialTreeId }>
{
  if (!rawId) return { partialTree, targetId: rawId }

  const targetId: string = rawId.includes('/__search__/')
    ? rawId.split('/__search__/')[1]
    : rawId

  let tree = partialTree

  // Fast path: if node exists we still return to allow caller to decide next steps
  // but do not early return if later logic depends on ancestor traversal.

  // Build ancestor candidates
  const decoded = decodeURIComponent(targetId)
  const clean = decoded.startsWith('/') ? decoded : `/${decoded}`
  const segs = clean.split('/').filter(Boolean)
  const candidates: PartialTreeId[] = []
  for (let i = segs.length; i >= 1; i -= 1) {
    const p = `/${segs.slice(0, i).join('/')}`
    candidates.push(encodeURIComponent(p))
  }

  let ancestorId: PartialTreeId | null = null
  let ancestor: PartialTreeFolder | undefined
  for (const cand of candidates) {
    const node = tree.find((n) => n.id === cand) as PartialTreeFolder | undefined
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

  if (!ancestor || !ancestorId) return { partialTree: tree, targetId }

  // Traverse from ancestor towards target and ensure intermediate nodes are revealed
  const ancestorDecoded = decodeURIComponent(ancestorId)
  const ancestorSegs = ancestorDecoded.split('/').filter(Boolean)
  const remaining = segs.slice(ancestorSegs.length)
  let current = ancestor as PartialTreeFolder

  for (let idx = 0; idx < remaining.length; idx += 1) {
    const pathSoFarDecoded = `/${segs
      .slice(0, ancestorSegs.length + idx + 1)
      .join('/')}`
    const childId = encodeURIComponent(pathSoFarDecoded)

    let child = tree.find((n) => n.id === childId) as PartialTreeFolder | undefined
    if (!child) {
      // fetch current to reveal children
      let items: CompanionFile[] = []
      let page: PartialTreeId | null = current.cached ? current.nextPagePath : current.id
      while (page) {
        const { items: pageItems, nextPagePath } = await apiList(page)
        items = items.concat(pageItems)
        page = nextPagePath
      }
      tree = afterOpenFolder(tree, items, current, null, validateSingleFile)
      child = tree.find((n) => n.id === childId) as PartialTreeFolder | undefined
      if (!child) break
    }
    current = child
  }

  return { partialTree: tree, targetId }
}

export default ensureAncestorsLoaded
