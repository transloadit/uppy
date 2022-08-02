import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause'

/**
 * Check that Assembly parameters are present and include all required fields.
 */
function validateParams (params) {
  if (params == null) {
    throw new Error('Transloadit: The `params` option is required.')
  }

  if (typeof params === 'string') {
    try {
      // eslint-disable-next-line no-param-reassign
      params = JSON.parse(params)
    } catch (err) {
      // Tell the user that this is not an Uppy bug!
      throw new ErrorWithCause('Transloadit: The `params` option is a malformed JSON string.', { cause: err })
    }
  }

  if (!params.auth || !params.auth.key) {
    throw new Error('Transloadit: The `params.auth.key` option is required. '
      + 'You can find your Transloadit API key at https://transloadit.com/c/template-credentials')
  }
}

/**
 * Combine Assemblies with the same options into a single Assembly for all the
 * relevant files.
 */
function dedupe (list) {
  const dedupeMap = Object.create(null)
  for (const { fileIDs, options } of list.filter(Boolean)) {
    const id = JSON.stringify(options)
    if (id in dedupeMap) {
      dedupeMap[id].fileIDArrays.push(fileIDs)
    } else {
      dedupeMap[id] = {
        options,
        fileIDArrays: [fileIDs],
      }
    }
  }

  return Object.values(dedupeMap).map(({ options, fileIDArrays }) => ({
    options,
    fileIDs: fileIDArrays.flat(1),
  }))
}

/**
 * Turn Transloadit plugin options and a list of files into a list of Assembly
 * options.
 */
class AssemblyOptions {
  constructor (files, opts) {
    this.files = files
    this.opts = opts
  }

  /**
   * Get Assembly options for a file.
   */
  async #getAssemblyOptions (file) {
    if (file == null) return undefined

    const options = this.opts
    const assemblyOptions = await options.getAssemblyOptions(file, options)

    // We check if the file is present here again, because it could had been
    // removed during the await, e.g. if the user hit cancel while we were
    // waiting for the options.
    if (file == null) return undefined

    if (Array.isArray(assemblyOptions.fields)) {
      assemblyOptions.fields = Object.fromEntries(
        assemblyOptions.fields.map((fieldName) => [fieldName, file.meta[fieldName]]),
      )
    } else if (assemblyOptions.fields == null) {
      assemblyOptions.fields = {}
    }

    validateParams(assemblyOptions.params)

    return {
      fileIDs: [file.id],
      options: assemblyOptions,
    }
  }

  /**
   * Generate a set of Assemblies that will handle the upload.
   * Returns a Promise for an object with keys:
   *  - fileIDs - an array of file IDs to add to this Assembly
   *  - options - Assembly options
   */
  async build () {
    const options = this.opts

    if (this.files.length > 0) {
      return Promise.all(
        this.files.map((file) => this.#getAssemblyOptions(file)),
      ).then(dedupe)
    }

    if (options.alwaysRunAssembly) {
      // No files, just generate one Assembly
      const assemblyOptions = await options.getAssemblyOptions(null, options)

      validateParams(assemblyOptions.params)
      return [{
        fileIDs: this.files.map((file) => file.id),
        options: assemblyOptions,
      }]
    }

    // If there are no files and we do not `alwaysRunAssembly`,
    // don't do anything.
    return []
  }
}

export default AssemblyOptions
export { validateParams }
