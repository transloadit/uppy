import type { PartialTree, PartialTreeFile, PartialTreeFolderNode, PartialTreeId } from "@uppy/core/lib/Uppy"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"

export interface Cache {
  [key: string]: (PartialTreeFile | PartialTreeFolderNode)[]
}

const getPath = (
  partialTree: PartialTree,
  id: PartialTreeId,
  cache: Cache
) : (PartialTreeFile | PartialTreeFolderNode)[] => {
  const sId = id === null ? 'null' : id
  if (cache[sId]) return cache[sId]

  const file = partialTree.find((f) => f.id === id)!

  if (file.type === 'root') return []

  const meAndParentPath = [file, ...getPath(partialTree, file.parentId, cache)]
  cache[sId] = meAndParentPath
  return meAndParentPath
}

// See "Uppy file properties" documentation for `.absolutePath` and `.relativePath` (https://uppy.io/docs/uppy/#working-with-uppy-files)
const injectPaths = (partialTree: PartialTree, files: PartialTreeFile[]) : PartialTreeFile[] => {
  const cache : Cache = {}

  const injectedFiles = files.map((file) => {
    const path : (PartialTreeFile | PartialTreeFolderNode)[] = getPath(partialTree, file.id, cache)

    const absFolders = path.toReversed()

    const firstCheckedFolderIndex = absFolders.findIndex((i) => i.type === 'folder' && i.status === 'checked')
    const relFolders = absFolders.slice(firstCheckedFolderIndex)
    
    const absDirPath = '/' + absFolders.map((i) => i.data.name).join('/')
    const relDirPath = relFolders.length === 1
      // Must return `undefined` (which later turns into `null` in `.getTagFile()`)
      // (https://github.com/transloadit/uppy/pull/4537#issuecomment-1629136652)
      ? undefined
      : relFolders.map((i) => i.data.name).join('/')

    return {
      ...file,
      data: {
        ...file.data,
        absDirPath,
        relDirPath
      }
    }
  })

  return injectedFiles
}

export default injectPaths
