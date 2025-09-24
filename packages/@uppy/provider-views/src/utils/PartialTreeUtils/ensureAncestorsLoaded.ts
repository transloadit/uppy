import type { PartialTree, PartialTreeFolder, PartialTreeId } from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'
import {
  normalizeSearchTarget,
  buildEncodedAncestorCandidates,
  findDeepestExistingAncestor,
  walkAndEnsurePath,
} from './pathLoaderCore.js'
import type { ApiList } from './pathLoaderCore.js'

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

  const targetId: string = normalizeSearchTarget(rawId)

  let tree = partialTree

  // Fast path: if node exists we still return to allow caller to decide next steps
  // but do not early return if later logic depends on ancestor traversal.

  // Build ancestor candidates
  const candidates: PartialTreeId[] = buildEncodedAncestorCandidates(targetId)

  const { ancestorId, ancestor } = findDeepestExistingAncestor(tree, candidates)

  if (!ancestor || !ancestorId) return { partialTree: tree, targetId }

  tree = await walkAndEnsurePath(tree, ancestor as PartialTreeFolder, targetId, apiList, validateSingleFile)

  return { partialTree: tree, targetId }
}

export default ensureAncestorsLoaded
