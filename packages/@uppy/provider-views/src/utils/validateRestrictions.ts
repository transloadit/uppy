import type { RestrictionError } from "@uppy/core/lib/Restricter"
import type { PartialTreeFile, UnknownProviderPlugin, UnknownSearchProviderPlugin } from "@uppy/core/lib/Uppy"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"
import remoteFileObjToLocal from "@uppy/utils/lib/remoteFileObjToLocal"

const validateRestrictions =
  (plugin: UnknownProviderPlugin<any, any> | UnknownSearchProviderPlugin<any, any>) =>
  (file: CompanionFile)
  : RestrictionError<any, any> | null => {
  if (file.isFolder) return null

  const localData = remoteFileObjToLocal(file)

  const { partialTree } = plugin.getPluginState()
  const aleadyAddedFiles = plugin.uppy.getFiles()
  const checkedFiles = partialTree.filter((item) => item.type === 'file' && item.status === 'checked') as PartialTreeFile[]
  const checkedFilesData = checkedFiles.map((item) => item.data)

  return plugin.uppy.validateRestrictions(localData, [...aleadyAddedFiles, ...checkedFilesData])
}

export default validateRestrictions
