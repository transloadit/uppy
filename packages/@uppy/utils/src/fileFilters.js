export function filterNonFailedFiles (files) {
  const hasError = (file) => 'error' in file && file.error

  return files.filter((file) => !hasError(file))
}

// Don't double-emit upload-started for Golden Retriever-restored files that were already started
export function filterFilesToEmitUploadStarted (files) {
  return files.filter((file) => !file.progress.uploadStarted || !file.isRestored)
}
