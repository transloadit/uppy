const Emitter = require('component-emitter')

/**
 * Track completion of multiple assemblies.
 *
 * Emits 'assembly-complete' when an assembly completes.
 * Emits 'assembly-error' when an assembly fails.
 * Exposes a `.promise` property that resolves when all assemblies have completed (or failed).
 */
class TransloaditAssemblyWatcher extends Emitter {
  constructor (uppy, assemblyIDs) {
    super()

    this.uppy = uppy
    this.assemblyIDs = assemblyIDs
    this.remaining = assemblyIDs.length

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })

    this.onAssemblyComplete = this.onAssemblyComplete.bind(this)
    this.onAssemblyError = this.onAssemblyError.bind(this)
    this.onImportError = this.onImportError.bind(this)

    this.addListeners()
  }

  watching (id) {
    return this.assemblyIDs.indexOf(id) !== -1
  }

  onAssemblyComplete (assembly) {
    if (!this.watching(assembly.assembly_id)) {
      return
    }

    this.uppy.log(`[Transloadit] AssemblyWatcher: Got Assembly finish ${assembly.assembly_id}`)

    // TODO set the `file.uploadURL` to a result?
    // We will probably need an option here so the plugin user can tell us
    // which result to pick…?

    this.emit('assembly-complete', assembly.assembly_id)

    this.checkAllComplete()
  }

  onAssemblyError (assembly, error) {
    if (!this.watching(assembly.assembly_id)) {
      return
    }

    this.uppy.log(`[Transloadit] AssemblyWatcher: Got Assembly error ${assembly.assembly_id}`)
    this.uppy.log(error)

    // Clear postprocessing state for all our files.
    this.emit('assembly-error', assembly.assembly_id, error)

    this.checkAllComplete()
  }

  onImportError (assembly, fileID, error) {
    if (!this.watching(assembly.assembly_id)) {
      return
    }

    // Not sure if we should be doing something when it's just one file failing.
    // ATM, the only options are 1) ignoring or 2) failing the entire upload.
    // I think failing the upload is better than silently ignoring.
    // In the future we should maybe have a way to resolve uploads with some failures,
    // like returning an object with `{ successful, failed }` uploads.
    this.onAssemblyError(assembly, error)
  }

  checkAllComplete () {
    this.remaining -= 1
    if (this.remaining === 0) {
      // We're done, these listeners can be removed
      this.removeListeners()
      this.resolve()
    }
  }

  removeListeners () {
    this.uppy.off('transloadit:complete', this.onAssemblyComplete)
    this.uppy.off('transloadit:assembly-error', this.onAssemblyError)
    this.uppy.off('transloadit:import-error', this.onImportError)
  }

  addListeners () {
    this.uppy.on('transloadit:complete', this.onAssemblyComplete)
    this.uppy.on('transloadit:assembly-error', this.onAssemblyError)
    this.uppy.on('transloadit:import-error', this.onImportError)
  }
}

module.exports = TransloaditAssemblyWatcher
