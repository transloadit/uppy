import type { PartialTree } from '@uppy/core/lib/Uppy'

// We're interested in all 'checked' leaves of this tree -
// I believe it's the most intuitive number we can show to the user
// given we don't have full information about how many files are inside of each selected folder.
const getNOfSelectedFiles = (partialTree: PartialTree): number => {
  const checkedLeaves = partialTree.filter((item) => {
    if (item.type === 'file' && item.status === 'checked') {
      return true
    }
    if (item.type === 'folder' && item.status === 'checked') {
      const doesItHaveChildren = partialTree.some(
        (i) => i.type !== 'root' && i.parentId === item.id,
      )
      return !doesItHaveChildren
    }
    return false
  })
  return checkedLeaves.length
}

export default getNOfSelectedFiles
