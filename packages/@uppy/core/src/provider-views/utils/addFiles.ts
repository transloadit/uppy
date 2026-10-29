import type {
  UnknownPlugin,
  UnknownProviderPlugin,
  UnknownSearchProviderPlugin,
} from '../../index.js'
import type {
  Body,
  CompanionFile,
  Meta,
  UppyFileNonGhost,
} from '../../utils/index.js'
import { getSafeFileId } from '../../utils/index.js'
import companionFileToUppyFile from './companionFileToUppyFile.js'

const addFiles = <M extends Meta, B extends Body>(
  companionFiles: CompanionFile[],
  plugin: UnknownPlugin<M, B>,
  provider:
    | UnknownProviderPlugin<M, B>['provider']
    | UnknownSearchProviderPlugin<M, B>['provider'],
): boolean => {
  const uppyFiles = companionFiles.map((f) =>
    companionFileToUppyFile<M, B>(f, plugin, provider),
  )

  const filesToAdd: UppyFileNonGhost<M, B>[] = []
  const filesAlreadyAdded: UppyFileNonGhost<M, B>[] = []
  uppyFiles.forEach((file) => {
    if (
      plugin.uppy.checkIfFileAlreadyExists(
        getSafeFileId(file, plugin.uppy.getID()),
      )
    ) {
      filesAlreadyAdded.push(file)
    } else {
      filesToAdd.push(file)
    }
  })

  if (filesToAdd.length > 0) {
    plugin.uppy.info(
      plugin.uppy.i18n('addedNumFiles', { numFiles: filesToAdd.length }),
    )
  }
  if (filesAlreadyAdded.length > 0) {
    plugin.uppy.info(
      `Not adding ${filesAlreadyAdded.length} files because they already exist`,
    )
  }
  // `uppy.addFiles` reports files rejected by restrictions or
  // `onBeforeFileAdded` with `info` instead of throwing.
  let addedCount = 0
  const onFilesAdded = (added: unknown[]) => {
    addedCount = added.length
  }
  plugin.uppy.on('files-added', onFilesAdded)
  try {
    plugin.uppy.addFiles(filesToAdd)
  } finally {
    plugin.uppy.off('files-added', onFilesAdded)
  }
  return filesToAdd.length === 0 || addedCount > 0
}

export default addFiles
