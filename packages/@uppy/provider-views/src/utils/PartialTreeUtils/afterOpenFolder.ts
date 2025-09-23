import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'

const afterOpenFolder = (
  oldPartialTree: PartialTree,
  discoveredItems: CompanionFile[],
  clickedFolder: PartialTreeFolder,
  currentPagePath: string | null,
  validateSingleFile: (file: CompanionFile) => string | null,
): PartialTree => {
  const prevByKey = new Map<string, PartialTreeFile | PartialTreeFolderNode>()
  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  }
  const safeEncode = (s: string) => {
    try {
      return encodeURIComponent(s)
    } catch {
      return s
    }
  }
  for (let i = 0; i < oldPartialTree.length; i += 1) {
    const node = oldPartialTree[i]
    if (node.type === 'root') continue
    const anyNode = node as any
    const keys: string[] = []
    if (typeof node.id === 'string') keys.push(node.id)
    const rp = anyNode?.data?.requestPath as string | undefined
    if (rp) {
      keys.push(rp)
      const dec = safeDecode(rp)
      const enc = safeEncode(dec)
      if (!keys.includes(dec)) keys.push(dec)
      if (!keys.includes(enc)) keys.push(enc)
    }
    for (let k = 0; k < keys.length; k += 1) {
      const key = keys[k]
      if (!prevByKey.has(key)) prevByKey.set(key, node as any)
    }
  }

  const foldersSrc = discoveredItems.filter((i) => i.isFolder === true)
  const filesSrc = discoveredItems.filter((i) => i.isFolder === false)

  const parentChecked =
    clickedFolder.type === 'folder' && clickedFolder.status === 'checked'

  const newFolderNodes: PartialTreeFolderNode[] = foldersSrc.map((folder) => {
    const prev = (prevByKey.get(folder.requestPath) || prevByKey.get(safeEncode(safeDecode(folder.requestPath)))) as
      | PartialTreeFolderNode
      | undefined
    const status = prev?.status ?? (parentChecked ? 'checked' : 'unchecked')
    const cached = prev?.cached ?? false
    return {
      type: 'folder',
      id: folder.requestPath,
      cached,
      nextPagePath: null,
      status,
      parentId: clickedFolder.id,
      data: folder,
    }
  })

  const newFileNodes: PartialTreeFile[] = filesSrc.map((file) => {
    const restrictionError = validateSingleFile(file)
    const prev = (prevByKey.get(file.requestPath) || prevByKey.get(safeEncode(safeDecode(file.requestPath)))) as
      | PartialTreeFile
      | undefined
    const keepChecked = prev?.status === 'checked' && !restrictionError
    return {
      type: 'file',
      id: file.requestPath,
      restrictionError,
      status:
        keepChecked || (parentChecked && !restrictionError)
          ? 'checked'
          : 'unchecked',
      parentId: clickedFolder.id,
      data: file,
    }
  })

  const updatedClickedFolder: PartialTreeFolder = {
    ...clickedFolder,
    cached: true,
    nextPagePath: currentPagePath,
  }
  const baseTree: PartialTree = oldPartialTree.map((node) =>
    node.id === updatedClickedFolder.id ? updatedClickedFolder : node,
  )

  // Build a robust id set that contains both encoded and decoded forms
  const idsToInsert = new Set<string>()
  const addIdVariants = (id: string) => {
    idsToInsert.add(id)
    const dec = safeDecode(id)
    const enc = safeEncode(dec)
    idsToInsert.add(dec)
    idsToInsert.add(enc)
  }
  for (let i = 0; i < newFolderNodes.length; i += 1) addIdVariants(newFolderNodes[i].id as string)
  for (let i = 0; i < newFileNodes.length; i += 1) addIdVariants(newFileNodes[i].id as string)

  const result: PartialTree = []
  for (let i = 0; i < baseTree.length; i += 1) {
    const node = baseTree[i]
    if (typeof node.id === 'string' && idsToInsert.has(node.id)) continue
    result.push(node)
  }
  for (let i = 0; i < newFolderNodes.length; i += 1) {
    result.push(newFolderNodes[i])
  }
  for (let i = 0; i < newFileNodes.length; i += 1) {
    result.push(newFileNodes[i])
  }

  // Recompute folder statuses based on currently known children so that
  // parents reflect 'checked' or 'partial' appropriately after merging in
  // previously selected descendants (e.g., when leaving search mode).
  const folderNodes = result.filter((n) => n.type === 'folder') as PartialTreeFolderNode[]
  const childrenByParentMap = new Map<string | null, (PartialTreeFile | PartialTreeFolderNode)[]>()
  for (let i = 0; i < result.length; i += 1) {
    const n = result[i]
    if (n.type === 'root') continue
    const arr = childrenByParentMap.get(n.parentId) || []
    arr.push(n as any)
    childrenByParentMap.set(n.parentId, arr)
  }
  for (let i = 0; i < folderNodes.length; i += 1) {
    const f = folderNodes[i]
    const children = (childrenByParentMap.get(f.id) || []) as (
      | PartialTreeFile
      | PartialTreeFolderNode
    )[]
    const validChildren = children.filter(
      (c) => !(c.type === 'file' && (c as PartialTreeFile).restrictionError),
    )
    if (validChildren.length === 0) continue
    const allChecked = validChildren.every((c) => c.status === 'checked')
    const allUnchecked = validChildren.every((c) => c.status === 'unchecked')
    // If we only know about some children, 'allChecked' still means all known
    // are checked—which is the expected UX after server-side search.
    f.status = allChecked ? 'checked' : allUnchecked ? 'unchecked' : 'partial'
  }

  return result
}

export default afterOpenFolder


