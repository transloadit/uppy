export const SET_META = 'UPPY_SET_META'
export const SET_FILE_META = 'UPPY_SET_FILE_META'
export const CUSTOM_PLUGIN_DATA = 'UPPY_CUSTOM_PLUGIN_DATA'
export const SET_CAPABILITIES = 'UPPY_SET_CAPABILITIES'

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
