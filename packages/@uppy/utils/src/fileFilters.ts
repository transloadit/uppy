import type { UppyFile } from './UppyFile'

export function filterNonFailedFiles(files: UppyFile[]): UppyFile[] {
  const hasError = (file: UppyFile): boolean => 'error' in file && !!file.error

  return files.filter((file) => !hasError(file))
}

// Don't double-emit upload-started for Golden Retriever-restored files that were already started
export function filterFilesToEmitUploadStarted(files: UppyFile[]): UppyFile[] {
  return files.filter(
    (file) => !file.progress?.uploadStarted || !file.isRestored,
  )
}
