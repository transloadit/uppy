import type Uppy from "@uppy/core"
import type { Meta, Body, TagFile } from "@uppy/utils/lib/UppyFile"
import { getSafeFileId } from "@uppy/utils/lib/generateFileID"

const addFiles = <M extends Meta, B extends Body>(
  tagFiles: TagFile<M>[],
  uppy: Uppy<M, B>
) => {
  const filesToAdd : TagFile<M>[] = []
  const filesAlreadyAdded : TagFile<M>[] = []
  tagFiles.forEach((tagFile) => {
    if (uppy.checkIfFileAlreadyExists(getSafeFileId(tagFile))) {
      filesAlreadyAdded.push(tagFile)
    } else {
      filesToAdd.push(tagFile)
    }
  })

  if (filesToAdd.length > 0) {
    uppy.info(
      uppy.i18n('addedNumFiles', { numFiles: filesToAdd.length })
    )
  }
  if (filesAlreadyAdded.length > 0) {
    uppy.info(`Not adding ${filesAlreadyAdded.length} files because they already exist`)
  }
  uppy.addFiles(filesToAdd)
}

export default addFiles
