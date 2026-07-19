import type { UppyFile } from './UppyFile.js'

const hasError = (file: UppyFile<any, any>) => 'error' in file && !!file.error

// We don't need to re-upload already successfully uploaded files
// so let's exclude them here:
// https://github.com/transloadit/uppy/issues/5930
// This happens for example when restoring a partially finished session (e.g. using golden retriever).
const isCompleted = (file: UppyFile<any, any>) => file.progress.uploadComplete

export function filterFilesToUpload(
  files: UppyFile<any, any>[],
): UppyFile<any, any>[] {
  return files.filter((file) => !hasError(file) && !isCompleted(file))
}

// Don't double-emit upload-started for Golden Retriever-restored files that were already started
export function filterFilesToEmitUploadStarted(
  files: UppyFile<any, any>[],
): UppyFile<any, any>[] {
  return files.filter(
    (file) => !file.progress?.uploadStarted || !file.isRestored,
  )
}
