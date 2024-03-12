import type { Uppy } from '@uppy/core'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import Emitter from 'component-emitter'
import type { AssemblyResponse } from '.'

/**
 * Track completion of multiple assemblies.
 *
 * Emits 'assembly-complete' when an assembly completes.
 * Emits 'assembly-error' when an assembly fails.
 * Exposes a `.promise` property that resolves when all assemblies have
 * completed (or failed).
 */
class TransloaditAssemblyWatcher<
  M extends Meta,
  B extends Body,
> extends Emitter {
  #assemblyIDs

  #remaining: number

  promise: Promise<void>

  #resolve: () => void

  #reject: (reason?: string) => void

  #uppy

  constructor(uppy: Uppy<M, B>, assemblyIDs: string[]) {
    super()

    this.#uppy = uppy
    this.#assemblyIDs = assemblyIDs
    this.#remaining = assemblyIDs.length

    this.promise = new Promise<void>((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })

    this.#addListeners()
  }

  /**
   * Are we watching this assembly ID?
   */
  #watching(id: string) {
    return this.#assemblyIDs.indexOf(id) !== -1
  }

  #onAssemblyComplete = (assembly: AssemblyResponse) => {
    if (!this.#watching(assembly.assembly_id)) {
      return
    }

    this.#uppy.log(
      `[Transloadit] AssemblyWatcher: Got Assembly finish ${assembly.assembly_id}`,
    )

    this.emit('assembly-complete', assembly.assembly_id)

    this.#checkAllComplete()
  }

  #onAssemblyCancel = (assembly: AssemblyResponse) => {
    if (!this.#watching(assembly.assembly_id)) {
      return
    }

    this.#checkAllComplete()
  }

  #onAssemblyError = (assembly: AssemblyResponse, error: Error) => {
    if (!this.#watching(assembly.assembly_id)) {
      return
    }

    this.#uppy.log(
      `[Transloadit] AssemblyWatcher: Got Assembly error ${assembly.assembly_id}`,
    )
    this.#uppy.log(error)

    this.emit('assembly-error', assembly.assembly_id, error)

    this.#checkAllComplete()
  }

  #onImportError = (
    assembly: AssemblyResponse,
    fileID: string,
    error: Error,
  ) => {
    if (!this.#watching(assembly.assembly_id)) {
      return
    }

    // Not sure if we should be doing something when it's just one file failing.
    // ATM, the only options are 1) ignoring or 2) failing the entire upload.
    // I think failing the upload is better than silently ignoring.
    // In the future we should maybe have a way to resolve uploads with some failures,
    // like returning an object with `{ successful, failed }` uploads.
    this.#onAssemblyError(assembly, error)
  }

  #checkAllComplete() {
    this.#remaining -= 1
    if (this.#remaining === 0) {
      // We're done, these listeners can be removed
      this.#removeListeners()
      this.#resolve()
    }
  }

  #removeListeners() {
    this.#uppy.off('transloadit:complete', this.#onAssemblyComplete)
    this.#uppy.off('transloadit:assembly-cancel', this.#onAssemblyCancel)
    this.#uppy.off('transloadit:assembly-error', this.#onAssemblyError)
    this.#uppy.off('transloadit:import-error', this.#onImportError)
  }

  #addListeners() {
    this.#uppy.on('transloadit:complete', this.#onAssemblyComplete)
    this.#uppy.on('transloadit:assembly-cancel', this.#onAssemblyCancel)
    this.#uppy.on('transloadit:assembly-error', this.#onAssemblyError)
    this.#uppy.on('transloadit:import-error', this.#onImportError)
  }
}

export default TransloaditAssemblyWatcher
