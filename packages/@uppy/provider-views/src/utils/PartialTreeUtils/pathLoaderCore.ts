import type { PartialTree, PartialTreeFolder, PartialTreeFolderNode, PartialTreeId } from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'
import afterOpenFolder from './afterOpenFolder.js'

// Shared ApiList type used by ensurePathLoaded/ensureAncestorsLoaded
export type ApiList = (directory: PartialTreeId) => Promise<{
  nextPagePath: PartialTreeId
  items: CompanionFile[]
}>

export function normalizeSearchTarget(rawId: PartialTreeId): string {
  if (!rawId) return rawId as unknown as string
  return rawId.includes('/__search__/') ? rawId.split('/__search__/')[1] : (rawId as string)
}

export function buildEncodedAncestorCandidates(targetId: string): PartialTreeId[] {
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

export function findDeepestExistingAncestor(
  tree: PartialTree,
  candidates: PartialTreeId[],
): { ancestorId: PartialTreeId | null; ancestor: PartialTreeFolder | undefined } {
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
  return { ancestorId, ancestor }
}

async function listAllPages(apiList: ApiList, start: PartialTreeId | null): Promise<CompanionFile[]> {
  let items: CompanionFile[] = []
  let page: PartialTreeId | null = start
  while (page) {
    const { items: pageItems, nextPagePath } = await apiList(page)
    items = items.concat(pageItems)
    page = nextPagePath
  }
  return items
}

export async function walkAndEnsurePath(
  tree: PartialTree,
  ancestor: PartialTreeFolder,
  targetId: string,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
): Promise<PartialTree> {
  const decodedTarget = decodeURIComponent(targetId)
  const cleanPath = decodedTarget.startsWith('/') ? decodedTarget : `/${decodedTarget}`
  const segs = cleanPath.split('/').filter(Boolean)

  const ancestorDecoded = decodeURIComponent(ancestor.id as string)
  const ancestorSegs = ancestorDecoded.split('/').filter(Boolean)
  const remaining = segs.slice(ancestorSegs.length)

  let current = ancestor
  let workingTree = tree

  for (let idx = 0; idx < remaining.length; idx += 1) {
    const pathSoFarDecoded = `/${segs.slice(0, ancestorSegs.length + idx + 1).join('/')}`
    const childId = encodeURIComponent(pathSoFarDecoded)
    let child = workingTree.find((n) => n.id === childId) as PartialTreeFolder | undefined
    if (!child) {
      // Need to list current to reveal children
      const toList = (current as PartialTreeFolder).cached ? (current as PartialTreeFolder).nextPagePath : current.id
      const items = await listAllPages(apiList, toList)
      workingTree = afterOpenFolder(workingTree, items, current, null, validateSingleFile)
      child = workingTree.find((n) => n.id === childId) as PartialTreeFolder | undefined
      if (!child) break
    }
    current = child
  }

  return workingTree
}

export async function ensureTargetFirstPageIfNeeded(
  tree: PartialTree,
  targetId: string,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
): Promise<PartialTree> {
  const targetFolder = tree.find((n) => n.id === targetId) as PartialTreeFolder | undefined
  if (targetFolder && targetFolder.type === 'folder') {
    const hasAnyChildren = tree.some(
      (n) => n.type !== 'root' && (n as PartialTreeFolderNode).parentId === targetFolder.id,
    )
    if (!hasAnyChildren || targetFolder.cached === false) {
      const { items, nextPagePath } = await apiList(targetFolder.id)
      return afterOpenFolder(tree, items, targetFolder, nextPagePath, validateSingleFile)
    }
  }
  return tree
}
