const { Plugin } = require('@uppy/core')

/**
 * Add a `results` key to the upload result data, containing all Transloadit Assembly results.
 */
class TransloaditResultsPlugin extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.type = 'modifier'
    this.id = 'TransloaditResultsPlugin'
    this._afterUpload = this._afterUpload.bind(this)
  }

  install () {
    this.uppy.addPostProcessor(this._afterUpload)
  }

  _afterUpload (fileIDs, uploadID) {
    const { currentUploads } = this.uppy.getState()
    const { result } = currentUploads[uploadID]
    const assemblies = result && Array.isArray(result.transloadit) ? result.transloadit : []

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
            stepName
          })
        })
      })
    })

    this.uppy.addResultData(uploadID, {
      results: assemblyResults
    })
  }
}

module.exports = TransloaditResultsPlugin
