import type { PartialTree, PartialTreeFolder, PartialTreeId } from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'
import {
  normalizeSearchTarget,
  buildEncodedAncestorCandidates,
  findDeepestExistingAncestor,
  walkAndEnsurePath,
  ensureTargetFirstPageIfNeeded,
} from './pathLoaderCore.js'
import type { ApiList } from './pathLoaderCore.js'

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
  const normalizedTargetId: string = normalizeSearchTarget(rawId)

  let tree = partialTree

  // If the full target already exists, we still want to ensure its first page is listed
  // so avoid returning early here.

  // 2) Walk upwards to find deepest existing ancestor folder
  const candidates: PartialTreeId[] = buildEncodedAncestorCandidates(normalizedTargetId)

  // Find the first existing ancestor in the partial tree
  const { ancestorId: existingAncestorId, ancestor: existingAncestor } = findDeepestExistingAncestor(tree, candidates)

  if (!existingAncestor || !existingAncestorId) {
    // Nothing we can do
    return { partialTree: tree, targetId: normalizedTargetId }
  }

  // 3) Progressively fetch forward from the existing ancestor towards the target
  tree = await walkAndEnsurePath(tree, existingAncestor as PartialTreeFolder, normalizedTargetId, apiList, validateSingleFile)

  // 4) Ensure the target folder itself has its first page listed so it isn't empty when opened
  tree = await ensureTargetFirstPageIfNeeded(tree, normalizedTargetId, apiList, validateSingleFile)

  return { partialTree: tree, targetId: normalizedTargetId }
}

export default ensurePathLoaded
