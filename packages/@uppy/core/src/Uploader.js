const { nanoid } = require('nanoid/non-secure')

class Uploader {
  preProcessors = new Set()

  uploaders = new Set()

  postProcessors = new Set()

  constructor (getState, setState, emit, log, getFile, getOpts) {
    // TODO: reduce the args needed
    this.getState = getState
    this.setState = setState
    this.emit = emit
    this.log = log
    this.getFile = getFile
    this.getOpts = getOpts
  }

  create (fileIDs, opts = {}) {
    // uppy.retryAll sets this to true — when retrying we want to ignore `allowNewUpload: false`
    const { forceAllowNewUpload = false } = opts
    const { allowNewUpload, currentUploads } = this.getState()
    // TODO: merge these, one is deprecated but it becomes unwieldy to change this everywhere
    // all the time
    const { allowMultipleUploadBatches, allowMultipleUploads } = this.getOpts()
    const uploadID = nanoid()

    if (!allowNewUpload && !forceAllowNewUpload) {
      throw new Error('Cannot create a new upload: already uploading.')
    }

    this.emit('upload', { id: uploadID, fileIDs })
    this.setState({
      allowNewUpload: allowMultipleUploadBatches && allowMultipleUploads,
      currentUploads: {
        ...currentUploads,
        [uploadID]: { fileIDs, step: 0, result: {} },
      },
    })

    return uploadID
  }

  async run (uploadID) {
    let { currentUploads } = this.getState()
    let currentUpload = currentUploads[uploadID]
    const restoreStep = currentUpload.step || 0

    if (!currentUpload) {
      return undefined
    }

    const steps = [
      ...this.preProcessors,
      ...this.uploaders,
      ...this.postProcessors,
    ]
    try {
      for (let step = restoreStep; step < steps.length; step++) {
        const fn = steps[step]
        const updatedUpload = { ...currentUpload, step }

        this.setState({ currentUploads: { ...currentUploads, [uploadID]: updatedUpload } })

        await fn(updatedUpload.fileIDs, uploadID)

        // Update currentUpload value in case it was modified asynchronously.
        currentUploads = this.getState().currentUploads
        currentUpload = currentUploads[uploadID]
      }
    } catch (err) {
      this.remove(uploadID)
      throw err
    }

    // Mark postprocessing step as complete if necessary; this addresses a case where we might get
    // stuck in the postprocessing UI while the upload is fully complete.
    // If the postprocessing steps do not do any work, they may not emit postprocessing events at
    // all, and never mark the postprocessing as complete. This is fine on its own but we
    // introduced code in the @uppy/core upload-success handler to prepare postprocessing progress
    // state if any postprocessors are registered. That is to avoid a "flash of completed state"
    // before the postprocessing plugins can emit events.
    //
    // So, just in case an upload with postprocessing plugins *has* completed *without* emitting
    // postprocessing completion, we do it instead.
    this.#completePostProcessing(uploadID)

    const result = this.#setCurrentUploadResult(uploadID)

    if (result) {
      this.emit('complete', result)
      this.remove(uploadID)
    }

    return result
  }

  get (uploadID) {
    const { currentUploads } = this.getState()

    return currentUploads[uploadID]
  }

  remove (uploadID) {
    const currentUploads = { ...this.getState().currentUploads }

    delete currentUploads[uploadID]

    this.setState({ currentUploads })
  }

  #completePostProcessing (uploadID) {
    this.get(uploadID).fileIDs.forEach((fileID) => {
      const file = this.getFile(fileID)
      if (file && file.progress.postprocess) {
        this.emit('postprocess-complete', file)
      }
    })
  }

  #setCurrentUploadResult (uploadID) {
    const { currentUploads } = this.getState()
    const currentUpload = currentUploads[uploadID]

    if (!currentUpload) {
      this.log(`Not setting result for an upload that has been removed: ${uploadID}`)
      return null
    }

    const files = currentUpload.fileIDs.map((fileID) => this.getFile(fileID))
    const successful = files.filter((file) => !file.error)
    const failed = files.filter((file) => file.error)
    const result = { ...currentUploads[uploadID].result, successful, failed, uploadID }

    this.setState({
      currentUploads: {
        ...currentUploads,
        [uploadID]: { ...currentUploads[uploadID], result },
      },
    })

    return result
  }
}

module.exports = { Uploader }
