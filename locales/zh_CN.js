/* eslint camelcase: 0 */

const zh_CN = {}

zh_CN.strings = {
  chooseFile: '选择文件',
  youHaveChosen: '你已经选择了： %{fileName}',
  orDragDrop: '或者拖到这里来',
  filesChosen: {
    0: '已选 %{smart_count} 个文件'
  },
  filesUploaded: {
    0: '已上传 %{smart_count} 个文件'
  },
  files: {
    0: '%{smart_count} 个文件'
  },
  uploadFiles: {
    0: '上传 %{smart_count} 个文件'
  },
  selectToUpload: '选择文件以上传',
  closeModal: '关闭对话框',
  upload: '上传'
}

zh_CN.pluralize = function (n) {
  return 0
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.zh_CN = zh_CN
}

module.exports = zh_CN
