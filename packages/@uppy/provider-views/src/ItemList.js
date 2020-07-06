const { h } = require('preact')
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
  const listContainer = document.querySelector('.uppy-ProviderBrowser-list')

  const scrollable = listContainer && listContainer.scrollHeight > listContainer.clientHeight

  const showLoadMoreButton = props.monthsRetrieved && (!listContainer || !scrollable)

  const moreButton = (
    <div class="uppy-Provider-empty">
      <button class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-moreBtn" onclick={props.handleLoadClick}>
        {props.i18n('loadMore')}
      </button>
    </div>)

  if (!props.folders.length && !props.files.length) {
    const message = props.monthsRetrieved ? props.i18n('noRecentFilesFound', { months_retrieved: props.monthsRetrieved }) : props.i18n('noFilesFound')
    return (
      <div>
        <div class="uppy-Provider-empty">{message}</div>
        {showLoadMoreButton && moreButton}
      </div>
    )
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
        {props.folders.map(folder =>
          Item({
            ...getSharedProps(folder, props),
            type: 'folder',
            isDisabled: props.isChecked(folder) ? props.isChecked(folder).loading : false,
            handleFolderClick: () => props.handleFolderClick(folder)
          })
        )}
        {props.files.map(file =>
          Item({
            ...getSharedProps(file, props),
            type: 'file',
            isDisabled: false
          })
        )}
        {showLoadMoreButton && moreButton}
      </ul>
    </div>
  )
}
