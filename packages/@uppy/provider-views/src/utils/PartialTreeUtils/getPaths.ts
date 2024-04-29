import type { PartialTree, PartialTreeFile, PartialTreeFolder, PartialTreeFolderNode } from "@uppy/core/lib/Uppy"

// See "Uppy file properties" documentation for `.absolutePath` and `.relativePath` (https://uppy.io/docs/uppy/#working-with-uppy-files)
const getPaths = (partialTree: PartialTree, file: PartialTreeFile) : { absDirPath: string, relDirPath: string | undefined } => {
  const path : (PartialTreeFile | PartialTreeFolderNode)[] = []
  let parent: PartialTreeFile | PartialTreeFolder = file
  while (true) {
    if (parent.type === 'root') break
    path.push(parent)
    parent = partialTree.find((folder) => folder.id === (parent as PartialTreeFolderNode).parentId) as PartialTreeFolder
  }

  const absFolders = path.toReversed()

  const firstCheckedFolderIndex = absFolders.findIndex((i) => i.type === 'folder' && i.status === 'checked')
  const relFolders = absFolders.slice(firstCheckedFolderIndex)
  
  const absDirPath = '/' + absFolders.map((i) => i.data.name).join('/')
  const relDirPath = relFolders.length === 1
    // Must return null
    // (https://github.com/transloadit/uppy/pull/4537#issuecomment-1629136652)
    ? undefined
    : relFolders.map((i) => i.data.name).join('/')

  return {
    absDirPath,
    relDirPath
  }
}

export default getPaths
