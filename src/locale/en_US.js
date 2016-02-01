const en_US = {}

en_US.strings = {
  chooseFile: 'Choose a file',
  youHaveChosen: 'You have chosen: %{fileName}',
  orDragDrop: 'or drag it here',
  filesChosen: {
    0: '%{smart_count} file selected',
    1: '%{smart_count} files selected'
  },
  upload: 'Upload'
}

en_US.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window.Uppy !== 'undefined') {
  window.Uppy.locale.en_US = en_US
}

export default en_US
