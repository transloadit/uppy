import Utils from './Utils'

export const SET_META = 'UPPY_SET_META'
export const SET_FILE_META = 'UPPY_SET_FILE_META'
export const CUSTOM_PLUGIN_DATA = 'UPPY_CUSTOM_PLUGIN_DATA'
export const SET_CAPABILITIES = 'UPPY_SET_CAPABILITIES'
export const ADD_FILE = 'UPPY_ADD_FILE'
export const REMOVE_FILE = 'UPPY_REMOVE_FILE'
export const SHOW_INFO = 'UPPY_SHOW_INFO'
export const HIDE_INFO = 'UPPY_HIDE_INFO'
export const SET_PREVIEW_URL = 'UPPY_SET_PREVIEW_URL'

export const setMeta = (metaData) => {
  return {
    type: SET_META,
    metaData
  }
}

export const setFileMeta = (fileId, metaData) => {
  return {
    type: SET_FILE_META,
    fileId,
    metaData
  }
}

export const customPluginData = (pluginId, data) => {
  return {
    type: CUSTOM_PLUGIN_DATA,
    pluginId,
    data
  }
}

export const setCapabilities = (data) => {
  return {
    type: SET_CAPABILITIES,
    data
  }
}

export const addFileToUppy = (file, fileId, fileName, fileExtension, fileTypeGeneral, fileTypeSpecific) => {
  return {
    type: ADD_FILE,
    file,
    fileId,
    fileName,
    fileExtension,
    fileTypeGeneral,
    fileTypeSpecific
  }
}

export const setPreviewUrl = (fileId, preview) => {
  return {
    type: SET_PREVIEW_URL,
    fileId,
    preview
  }
}

/**
 * Generate a preview image for the given file, if possible.
 */
export const generatePreview = (fileId, file, fileTypeSpecific) => {
  return (dispatch) => {
    if (Utils.isPreviewSupported(fileTypeSpecific) && !file.isRemote) {
      Utils.createThumbnail(file, 200).then((thumbnail) => {
        dispatch(setPreviewUrl(fileId, thumbnail))
      }).catch((err) => {
        console.warn(err.stack || err.message)
      })
    }
  }
}

export const addFile = (source, name, type, data) => {
  return (dispatch, getState, { uppy }) => {
    const currentState = getState()
    const file = {
      source,
      name,
      type,
      data
    }

    // Wrap this in a Promise `.then()` handler so errors will reject the Promise instead of throwing.
    return Promise.resolve()
    .then(() => uppy.opts.onBeforeFileAdded(file, currentState.files))
    .catch((err) => {
      this.info(err, 'error', 5000)
      return Promise.reject(`onBeforeFileAdded: ${err}`)
    }).then(() => {
      return Utils.getFileType(file).then((fileType) => {
        const fileName = file.name || 'noname'
        const fileExtension = Utils.getFileNameAndExtension(fileName)[1]
        const fileId = Utils.generateFileID(file)
        const fileTypeGeneral = fileType[0]
        const fileTypeSpecific = fileType[1]

        const restrictions = Utils.checkRestrictions(uppy.opts.restrictions, false, file.data, fileType, currentState.files)
        if (restrictions.info) {
          dispatch(showInfo(restrictions.info.message, restrictions.info.type, restrictions.info.duration))
        }
        if (restrictions.status === false) {
          return Promise.reject('File not allowed')
        }

        dispatch(addFileToUppy(file, fileId, fileName, fileExtension, fileTypeGeneral, fileTypeSpecific))
        uppy.emit('core:file-added', fileId)
        dispatch(generatePreview(fileId, file, fileTypeSpecific))

        uppy.log(`Added file: ${fileName}, ${fileId}, mime type: ${fileType}`)

        if (uppy.opts.autoProceed && !uppy.scheduledAutoProceed) {
          uppy.scheduledAutoProceed = setTimeout(() => {
            uppy.scheduledAutoProceed = null
            uppy.upload().catch((err) => {
              console.error(err.stack || err.message || err)
            })
          }, 4)
        }
      })
    })
  }
}

export const removeFileAction = (fileId) => {
  return {
    type: REMOVE_FILE,
    fileId
  }
}

export const removeFile = (fileId) => {
  return (dispatch, getState, { uppy }) => {
    const currentState = getState()

    dispatch(removeFileAction(fileId))
    // this.calculateTotalProgress()
    uppy.emit('core:file-removed', fileId)

    // Clean up object URLs.
    if (currentState.files[fileId].preview && Utils.isObjectURL(currentState.files[fileId].preview)) {
      URL.revokeObjectURL(currentState.files[fileId].preview)
    }

    uppy.log(`Removed file: ${fileId}`)
  }
}

export const showInfoAction = (isHidden, infoType, message, details) => {
  return {
    type: SHOW_INFO,
    isHidden,
    infoType,
    message,
    details
  }
}

export const hideInfo = () => {
  return {
    type: HIDE_INFO
  }
}

export const showInfo = (message, type, duration) => {
  return (dispatch, { uppy }) => {
    const isComplexMessage = typeof message === 'object'
    const message = isComplexMessage ? message.message : message
    const details = isComplexMessage ? message.details : null
    dispatch(showInfoAction(false, type || 'info', message, details))

    window.clearTimeout(uppy.infoTimeoutID)
    if (duration === 0) {
      uppy.infoTimeoutID = undefined
      return
    }

    // hide the informer after `duration` milliseconds
    this.infoTimeoutID = setTimeout(() => {
      dispatch(hideInfo())
    }, duration)
  }
}
