import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'

const afterScrollFolder = (
  oldPartialTree: PartialTree,
  currentFolderId: PartialTreeId,
  items: CompanionFile[],
  nextPagePath: string | null,
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

  const currentFolder = oldPartialTree.find(
    (i) => i.id === currentFolderId,
  ) as PartialTreeFolder

  const newFoldersSrc = items.filter((i) => i.isFolder === true)
  const newFilesSrc = items.filter((i) => i.isFolder === false)

  const scrolledFolder: PartialTreeFolder = { ...currentFolder, nextPagePath }
  const baseTree: PartialTree = oldPartialTree.map((node) =>
    node.id === scrolledFolder.id ? scrolledFolder : node,
  )

  const parentChecked =
    scrolledFolder.type === 'folder' && scrolledFolder.status === 'checked'

  const newFolderNodes: PartialTreeFolderNode[] = newFoldersSrc.map(
    (folder) => {
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
        parentId: scrolledFolder.id,
        data: folder,
      }
    },
  )

  const newFileNodes: PartialTreeFile[] = newFilesSrc.map((file) => {
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
      parentId: scrolledFolder.id,
      data: file,
    }
  })

  const idsToInsert = new Set<string>([
    ...newFolderNodes.map((n) => n.id as string),
    ...newFileNodes.map((n) => n.id as string),
  ])

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

  return result
}

export default afterScrollFolder


