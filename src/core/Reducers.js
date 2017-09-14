import { SET_META, SET_FILE_META, CUSTOM_PLUGIN_DATA, SET_CAPABILITIES } from './Actions'

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
    default:
      return state
  }
}

export default reducers
