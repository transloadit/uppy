const { h } = require('preact')
const remoteFileObjToLocal = require('@uppy/utils/lib/remoteFileObjToLocal')
const Item = require('./Item/index')

// Hopefully this name will not be used by Google
const VIRTUAL_SHARED_DIR = 'shared-with-me'

const getSharedProps = (fileOrFolder, props) => ({
  id: fileOrFolder.id,
  title: fileOrFolder.name,
  getItemIcon: () => fileOrFolder.icon,
  isChecked: props.isChecked(fileOrFolder),
  toggleCheckbox: (e) => props.toggleCheckbox(e, fileOrFolder),
  columns: props.columns,
  showTitles: props.showTitles,
  viewType: props.viewType,
  i18n: props.i18n,
})

module.exports = (props) => {
  const { folders, files, handleScroll, isChecked } = props

  if (!folders.length && !files.length) {
    return <div className="uppy-Provider-empty">{props.i18n('noFilesFound')}</div>
  }

  return (
    <div className="uppy-ProviderBrowser-body">
      <ul
        className="uppy-ProviderBrowser-list"
        onScroll={handleScroll}
        role="listbox"
        // making <ul> not focusable for firefox
        tabIndex="-1"
      >
        {folders.map(folder => {
          return Item({
            ...getSharedProps(folder, props),
            type: 'folder',
            isDisabled: isChecked(folder) ? isChecked(folder).loading : false,
            isCheckboxDisabled: folder.id === VIRTUAL_SHARED_DIR,
            handleFolderClick: () => props.handleFolderClick(folder),
          })
        })}
        {files.map(file => {
          const validateRestrictions = props.validateRestrictions(
            remoteFileObjToLocal(file),
            [...props.uppyFiles, ...props.currentSelection]
          )
          const sharedProps = getSharedProps(file, props)
          const restrictionReason = validateRestrictions.reason

          return Item({
            ...sharedProps,
            type: 'file',
            isDisabled: !validateRestrictions.result && !sharedProps.isChecked,
            restrictionReason,
          })
        })}
      </ul>
    </div>
  )
}
