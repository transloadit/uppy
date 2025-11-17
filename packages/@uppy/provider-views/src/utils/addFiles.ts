import type { UnknownPlugin } from '@uppy/core'
import type {
  Body,
  CompanionClientProvider,
  CompanionClientSearchProvider,
  CompanionFile,
  Meta,
  UppyFileNonGhost,
} from '@uppy/utils'
import { getSafeFileId } from '@uppy/utils'
import companionFileToUppyFile from './companionFileToUppyFile.js'

const addFiles = <M extends Meta, B extends Body>(
  companionFiles: CompanionFile[],
  plugin: UnknownPlugin<M, B>,
  provider: CompanionClientProvider | CompanionClientSearchProvider,
): void => {
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
  plugin.uppy.addFiles(filesToAdd)
}

export default addFiles
