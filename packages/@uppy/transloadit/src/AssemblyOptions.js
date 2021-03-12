/**
 * Check that Assembly parameters are present and include all required fields.
 */
function validateParams (params) {
  if (!params) {
    throw new Error('Transloadit: The `params` option is required.')
  }

  if (typeof params === 'string') {
    try {
      params = JSON.parse(params)
    } catch (err) {
      // Tell the user that this is not an Uppy bug!
      err.message = 'Transloadit: The `params` option is a malformed JSON string: ' +
        err.message
      throw err
    }
  }

  if (!params.auth || !params.auth.key) {
    throw new Error('Transloadit: The `params.auth.key` option is required. ' +
      'You can find your Transloadit API key at https://transloadit.com/account/api-settings.')
  }
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
   * Normalize Uppy-specific Assembly option features to a Transloadit-
   * compatible object.
   */
  _normalizeAssemblyOptions (file, assemblyOptions) {
    if (Array.isArray(assemblyOptions.fields)) {
      const fieldNames = assemblyOptions.fields
      assemblyOptions.fields = {}
      fieldNames.forEach((fieldName) => {
        assemblyOptions.fields[fieldName] = file.meta[fieldName]
      })
    }

    if (!assemblyOptions.fields) {
      assemblyOptions.fields = {}
    }

    return assemblyOptions
  }

  /**
   * Get Assembly options for a file.
   */
  _getAssemblyOptions (file) {
    const options = this.opts

    return Promise.resolve()
      .then(() => {
        return options.getAssemblyOptions(file, options)
      })
      .then((assemblyOptions) => {
        return this._normalizeAssemblyOptions(file, assemblyOptions)
      })
      .then((assemblyOptions) => {
        validateParams(assemblyOptions.params)

        return {
          fileIDs: [file.id],
          options: assemblyOptions
        }
      })
  }

  /**
   * Combine Assemblies with the same options into a single Assembly for all the
   * relevant files.
   */
  _dedupe (list) {
    const dedupeMap = Object.create(null)
    list.forEach(({ fileIDs, options }) => {
      const id = JSON.stringify(options)
      if (dedupeMap[id]) {
        dedupeMap[id].fileIDs.push(...fileIDs)
      } else {
        dedupeMap[id] = {
          options,
          fileIDs: [...fileIDs]
        }
      }
    })

    return Object.keys(dedupeMap).map((id) => dedupeMap[id])
  }

  /**
   * Generate a set of Assemblies that will handle the upload.
   * Returns a Promise for an object with keys:
   *  - fileIDs - an array of file IDs to add to this Assembly
   *  - options - Assembly options
   */
  build () {
    const options = this.opts

    if (this.files.length > 0) {
      return Promise.all(
        this.files.map((file) => this._getAssemblyOptions(file))
      ).then((list) => {
        return this._dedupe(list)
      })
    }

    if (options.alwaysRunAssembly) {
      // No files, just generate one Assembly
      return Promise.resolve(
        options.getAssemblyOptions(null, options)
      ).then((assemblyOptions) => {
        validateParams(assemblyOptions.params)
        return [{
          fileIDs: this.files.map((file) => file.id),
          options: assemblyOptions
        }]
      })
    }

    // If there are no files and we do not `alwaysRunAssembly`,
    // don't do anything.
    return Promise.resolve([])
  }
}

module.exports = AssemblyOptions
module.exports.validateParams = validateParams
