import type { UppyFile } from './UppyFile.js'

export function filterNonFailedFiles(
  files: UppyFile<any, any>[],
): UppyFile<any, any>[] {
  const hasError = (file: UppyFile<any, any>): boolean =>
    'error' in file && !!file.error

  return files.filter((file) => !hasError(file))
}

// Don't double-emit upload-started for Golden Retriever-restored files that were already started
export function filterFilesToEmitUploadStarted(
  files: UppyFile<any, any>[],
): UppyFile<any, any>[] {
  return files.filter(
    (file) => !file.progress?.uploadStarted || !file.isRestored,
  )
}
