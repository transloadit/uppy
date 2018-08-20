/**
 * Check that assembly parameters are present and include all required fields.
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
      'You can find your Transloadit API key at https://transloadit.com/accounts/credentials.')
  }
}

/**
 * Turn Transloadit plugin options and a list of files
 * into a list of assembly options.
 */
class AssemblyOptions {
  constructor (files, opts) {
    this.files = files
    this.opts = opts
  }

  normalizeAssemblyOptions (file, assemblyOptions) {
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

  getAssemblyOptions (file) {
    const options = this.opts

    return Promise.resolve()
      .then(() => {
        return options.getAssemblyOptions(file, options)
      })
      .then((assemblyOptions) => {
        return this.normalizeAssemblyOptions(file, assemblyOptions)
      })
      .then((assemblyOptions) => {
        validateParams(assemblyOptions.params)

        return {
          fileIDs: [file.id],
          options: assemblyOptions
        }
      })
  }

  dedupe (list) {
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

  build () {
    const options = this.opts

    if (this.files.length > 0) {
      return Promise.all(
        this.files.map((file) => this.getAssemblyOptions(file))
      ).then((list) => {
        return this.dedupe(list)
      })
    }

    if (options.alwaysRunAssembly) {
      // No files, just generate one assembly
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

module.exports = Object.assign(AssemblyOptions, { validateParams })
