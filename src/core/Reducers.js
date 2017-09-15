import { SET_META, SET_FILE_META, CUSTOM_PLUGIN_DATA, SET_CAPABILITIES, ADD_FILE, SHOW_INFO, HIDE_INFO, SET_PREVIEW_URL } from './Actions'

const setMeta = (state, action) => {
  return {
    ...state,
    meta: Object.assign(state.meta, action.metaData)
  }
}

const setFileMeta = (state, action) => {
  const updatedFiles = Object.assign({}, state.files)
  const newMeta = Object.assign({}, updatedFiles[action.fileId].meta, action.metaData)
  updatedFiles[action.fileId] = Object.assign({}, updatedFiles[action.fileId], {
    meta: newMeta
  })
  return {
    ...state,
    files: updatedFiles
  }
}

const customPluginData = (state, action) => {
  const updatedPlugins = Object.assign({}, state.plugins)
  updatedPlugins[action.pluginId] = Object.assign({}, updatedPlugins[action.pluginId], action.data)
  return {
    ...state,
    plugins: updatedPlugins
  }
}

const setCapabilities = (state, action) => {
  return {
    ...state,
    capabilities: Object.assign(state.capabilities, action.data)
  }
}

const addFile = (state, action) => {
  const newFile = {
    source: action.file.source || '',
    id: action.fileId,
    name: action.fileName,
    extension: action.fileExtension || '',
    meta: Object.assign({}, { name: action.fileName }, state.meta),
    type: {
      general: action.fileTypeGeneral,
      specific: action.fileTypeSpecific
    },
    data: action.file.data,
    progress: {
      percentage: 0,
      bytesUploaded: 0,
      bytesTotal: action.file.data.size || 0,
      uploadComplete: false,
      uploadStarted: false
    },
    size: action.file.data.size || 'N/A',
    isRemote: action.file.isRemote || false,
    remote: action.file.remote || '',
    preview: action.file.preview
  }
  const newFiles = {}
  newFiles[action.fileId] = newFile
  return {
    ...state,
    files: Object.assign(state.files, newFiles)
  }
}

const showInfo = (state, action) => {
  return {
    ...state,
    info: {
      isHidden: action.isHidden,
      type: action.infoType,
      message: action.message,
      details: action.details
    }
  }
}

const hideInfo = (state, action) => {
  return {
    ...state,
    info: Object.assign(state.info, { isHidden: true })
  }
}

const setPreviewUrl = (state, action) => {
  return {
    ...state,
    files: Object.assign({}, state.files, {
      [action.fileId]: Object.assign({}, state.files[action.fileId], {
        preview: action.preview
      })
    })
  }
}

function reducers (
    state = {},
    action
) {
  switch (action.type) {
    case SET_META:
      return setMeta(state, action)
    case SET_FILE_META:
      return setFileMeta(state, action)
    case CUSTOM_PLUGIN_DATA:
      return customPluginData(state, action)
    case SET_CAPABILITIES:
      return setCapabilities(state, action)
    case ADD_FILE:
      return addFile(state, action)
    case SHOW_INFO:
      return showInfo(state, action)
    case HIDE_INFO:
      return hideInfo(state, action)
    case SET_PREVIEW_URL:
      return setPreviewUrl(state, action)
    default:
      return state
  }
}

export default reducers
