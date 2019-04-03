const Emitter = require('component-emitter')

/**
 * Track completion of multiple assemblies.
 *
 * Emits 'assembly-complete' when an assembly completes.
 * Emits 'assembly-error' when an assembly fails.
 * Exposes a `.promise` property that resolves when all assemblies have
 * completed (or failed).
 */
class TransloaditAssemblyWatcher extends Emitter {
  constructor (uppy, assemblyIDs) {
    super()

    this._uppy = uppy
    this._assemblyIDs = assemblyIDs
    this._remaining = assemblyIDs.length

    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })

    this._onAssemblyComplete = this._onAssemblyComplete.bind(this)
    this._onAssemblyCancel = this._onAssemblyCancel.bind(this)
    this._onAssemblyError = this._onAssemblyError.bind(this)
    this._onImportError = this._onImportError.bind(this)

    this._addListeners()
  }

  /**
   * Are we watching this assembly ID?
   */
  _watching (id) {
    return this._assemblyIDs.indexOf(id) !== -1
  }

  _onAssemblyComplete (assembly) {
    if (!this._watching(assembly.assembly_id)) {
      return
    }

    this._uppy.log(`[Transloadit] AssemblyWatcher: Got Assembly finish ${assembly.assembly_id}`)

    this.emit('assembly-complete', assembly.assembly_id)

    this._checkAllComplete()
  }

  _onAssemblyCancel (assembly) {
    if (!this._watching(assembly.assembly_id)) {
      return
    }

    this._checkAllComplete()
  }

  _onAssemblyError (assembly, error) {
    if (!this._watching(assembly.assembly_id)) {
      return
    }

    this._uppy.log(`[Transloadit] AssemblyWatcher: Got Assembly error ${assembly.assembly_id}`)
    this._uppy.log(error)

    this.emit('assembly-error', assembly.assembly_id, error)

    this._checkAllComplete()
  }

  _onImportError (assembly, fileID, error) {
    if (!this._watching(assembly.assembly_id)) {
      return
    }

    // Not sure if we should be doing something when it's just one file failing.
    // ATM, the only options are 1) ignoring or 2) failing the entire upload.
    // I think failing the upload is better than silently ignoring.
    // In the future we should maybe have a way to resolve uploads with some failures,
    // like returning an object with `{ successful, failed }` uploads.
    this._onAssemblyError(assembly, error)
  }

  _checkAllComplete () {
    this._remaining -= 1
    if (this._remaining === 0) {
      // We're done, these listeners can be removed
      this._removeListeners()
      this._resolve()
    }
  }

  _removeListeners () {
    this._uppy.off('transloadit:complete', this._onAssemblyComplete)
    this._uppy.off('transloadit:assembly-cancel', this._onAssemblyCancel)
    this._uppy.off('transloadit:assembly-error', this._onAssemblyError)
    this._uppy.off('transloadit:import-error', this._onImportError)
  }

  _addListeners () {
    this._uppy.on('transloadit:complete', this._onAssemblyComplete)
    this._uppy.on('transloadit:assembly-cancel', this._onAssemblyCancel)
    this._uppy.on('transloadit:assembly-error', this._onAssemblyError)
    this._uppy.on('transloadit:import-error', this._onImportError)
  }
}

module.exports = TransloaditAssemblyWatcher
