const { BasePlugin } = require('@uppy/core')

/**
 * Add a `results` key to the upload result data, containing all Transloadit Assembly results.
 */
class TransloaditResultsPlugin extends BasePlugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.type = 'modifier'
    this.id = this.opts.id || 'TransloaditResultsPlugin'
  }

  install () {
    this.uppy.addPostProcessor(this.#afterUpload)
  }

  #afterUpload = (fileIDs, uploadID) => {
    const { currentUploads } = this.uppy.getState()
    const { result } = currentUploads[uploadID]
    const assemblies = Array.isArray(result?.transloadit) ? result.transloadit : []

    // Merge the assembly.results[*] arrays and add `stepName` and
    // `assemblyId` properties.
    const assemblyResults = []
    assemblies.forEach((assembly) => {
      Object.keys(assembly.results).forEach((stepName) => {
        const results = assembly.results[stepName]
        results.forEach((result) => {
          assemblyResults.push({
            ...result,
            assemblyId: assembly.assembly_id,
            stepName,
          })
        })
      })
    })

    this.uppy.addResultData(uploadID, {
      results: assemblyResults,
    })
  }
}

module.exports = TransloaditResultsPlugin
