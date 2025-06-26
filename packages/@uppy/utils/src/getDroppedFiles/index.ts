import fallbackApi from './utils/fallbackApi.js'
import webkitGetAsEntryApi from './utils/webkitGetAsEntryApi/index.js'

/**
 * Returns a promise that resolves to the array of dropped files (if a folder is
 * dropped, and browser supports folder parsing - promise resolves to the flat
 * array of all files in all directories).
 * Each file has .relativePath prop appended to it (e.g. "/docs/Prague/ticket_from_prague_to_ufa.pdf")
 * if browser supports it. Otherwise it's undefined.
 *
 * @param dataTransfer
 * @param options
 * @param options.logDropError - a function that's called every time some
 * folder or some file error out (e.g. because of the folder name being too long
 * on Windows). Notice that resulting promise will always be resolved anyway.
 *
 * @returns {Promise} - Array<File>
 */
export default async function getDroppedFiles(
  dataTransfer: DataTransfer,
  options?: {
    logDropError?: any
  },
): Promise<File[]> {
  // Get all files from all subdirs. Works (at least) in Chrome, Mozilla, and Safari
  const logDropError = options?.logDropError ?? Function.prototype
  try {
    const accumulator = []
    for await (const file of webkitGetAsEntryApi(dataTransfer, logDropError)) {
      accumulator.push(file as File)
    }
    return accumulator
    // Otherwise just return all first-order files
  } catch {
    return fallbackApi(dataTransfer)
  }
}
