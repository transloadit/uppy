const { nanoid } = require('nanoid/non-secure')

class Uploader {
  preProcessors = new Set()

  uploaders = new Set()

  postProcessors = new Set()

  #getOpts

  constructor (getOpts) {
    this.#getOpts = getOpts
  }

  addPreProcessor (fn) {
    this.preProcessors.add(fn)
  }

  removePreProcessor (fn) {
    return this.preProcessors.delete(fn)
  }

  addPostProcessor (fn) {
    this.postProcessors.add(fn)
  }

  removePostProcessor (fn) {
    return this.postProcessors.delete(fn)
  }

  addUploader (fn) {
    this.uploaders.add(fn)
  }

  removeUploader (fn) {
    return this.uploaders.delete(fn)
  }

  create (fileIDs, forced) {
    const { store, allowMultipleUploadBatches } = this.#getOpts()
    const { allowNewUpload, currentUploads } = store.getState()
    const uploadID = nanoid()

    if (!allowNewUpload && !forced) {
      throw new Error('Cannot create a new upload: already uploading.')
    }

    store.setState({
      allowNewUpload: allowMultipleUploadBatches,
      currentUploads: {
        ...currentUploads,
        [uploadID]: { fileIDs, step: 0, result: {} },
      },
    })

    return uploadID
  }

  get (uploadID) {
    const { store } = this.#getOpts()
    return store.getState().currentUploads[uploadID]
  }

  remove (uploadID) {
    const { store } = this.#getOpts()
    const currentUploads = { ...store.getState().currentUploads }

    delete currentUploads[uploadID]

    store.setState({ currentUploads })
  }

  async run (uploadID, step = 0) {
    const { store } = this.#getOpts()
    const { currentUploads } = store.getState()
    const currentUpload = currentUploads[uploadID]
    const steps = [...this.preProcessors, ...this.uploaders, ...this.postProcessors]

    if (!currentUpload || step >= steps.length) {
      return
    }

    try {
      const runner = steps[step]
      const updatedUpload = { ...currentUpload, step }

      store.setState({ currentUploads: { ...currentUploads, [uploadID]: updatedUpload } })

      await runner(updatedUpload.fileIDs, uploadID)

      this.run(uploadID, step + 1)
    } catch (err) {
      this.remove(uploadID)
      throw err
    }
  }

  getIsFileUploadPaused (fileID) {
    const { store } = this.#getOpts()
    const { files, capabilities } = store.getState()
    const file = files[fileID]

    if (!capabilities.resumableUploads || file.uploadComplete) {
      return undefined
    }

    const wasPaused = file.isPaused || false
    const isPaused = !wasPaused

    return isPaused
  }

  setCurrentUploadResult (uploadID) {
    const { store } = this.#getOpts()
    const { currentUploads, files } = store.getState()
    const filesFromUpload = currentUploads[uploadID].fileIDs.map((fileID) => files[fileID])
    const successful = filesFromUpload.filter((file) => !file.error)
    const failed = filesFromUpload.filter((file) => file.error)
    const result = { ...currentUploads[uploadID].result, successful, failed, uploadID }

    store.setState({
      currentUploads: {
        ...currentUploads,
        [uploadID]: { ...currentUploads[uploadID], result },
      },
    })

    return result
  }

  toggleAll (isPaused) {
    const { store } = this.#getOpts()
    const { files } = store.getState()

    const pausedFiles = Object.fromEntries(Object.entries(files).map(([id, file]) => {
      if (!file.progress.uploadComplete && file.progress.uploadStarted) {
        return [id, { ...file, isPaused }]
      }
      return [id, file]
    }))

    store.setState({ files: pausedFiles })
  }

  retryAll () {
    const { store } = this.#getOpts()
    const { files } = store.getState()
    const filesIDsToRetry = []

    const updatedFiles = Object.fromEntries(Object.entries(files).map(([id, file]) => {
      if (file.error) {
        filesIDsToRetry.push(id)
        return [id, { ...file, isPaused: false, error: null }]
      }
      return [id, file]
    }))

    store.setState({ files: updatedFiles, error: null })

    return filesIDsToRetry
  }
}

module.exports = { Uploader }
