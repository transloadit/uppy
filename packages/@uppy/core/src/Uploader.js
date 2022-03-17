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

  async run (uploadID) {
    const { store } = this.#getOpts()
    let { currentUploads } = store.getState()
    let currentUpload = currentUploads[uploadID]
    const restoreStep = currentUpload.step || 0

    if (!currentUpload) {
      return
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

        store.setState({ currentUploads: { ...currentUploads, [uploadID]: updatedUpload } })

        await fn(updatedUpload.fileIDs, uploadID)

        // Update currentUpload value in case it was modified asynchronously.
        currentUploads = store.getState().currentUploads
        currentUpload = currentUploads[uploadID]
      }
    } catch (err) {
      this.remove(uploadID)
      throw err
    }
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
}

module.exports = { Uploader }
