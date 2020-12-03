const { h } = require('preact')
const remoteFileObjToLocal = require('@uppy/utils/lib/remoteFileObjToLocal')
const Item = require('./Item/index')

const getSharedProps = (fileOrFolder, props) => ({
  id: fileOrFolder.id,
  title: fileOrFolder.name,
  getItemIcon: () => fileOrFolder.icon,
  isChecked: props.isChecked(fileOrFolder),
  toggleCheckbox: (e) => props.toggleCheckbox(e, fileOrFolder),
  columns: props.columns,
  showTitles: props.showTitles,
  viewType: props.viewType,
  i18n: props.i18n
})

module.exports = (props) => {
  if (!props.folders.length && !props.files.length) {
    return <div class="uppy-Provider-empty">{props.i18n('noFilesFound')}</div>
  }

  return (
    <div class="uppy-ProviderBrowser-body">
      <ul
        class="uppy-ProviderBrowser-list"
        onscroll={props.handleScroll}
        role="listbox"
        // making <ul> not focusable for firefox
        tabindex="-1"
      >
        {props.folders.map(folder => {
          return Item({
            ...getSharedProps(folder, props),
            type: 'folder',
            isDisabled: props.isChecked(folder) ? props.isChecked(folder).loading : false,
            handleFolderClick: () => props.handleFolderClick(folder)
          })
        })}
        {props.files.map(file => {
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
            restrictionReason: restrictionReason
          })
        })}
      </ul>
    </div>
  )
}
