const classNames = require('classnames')
const Breadcrumbs = require('./Breadcrumbs')
const Filter = require('./Filter')
const ItemList = require('./ItemList')
const FooterActions = require('./FooterActions')
const { h } = require('preact')

const Browser = (props) => {
  const {
    currentSelection,
    folders,
    files,
    uppyFiles,
    filterItems,
    filterInput,
    maxNumberOfFiles,
    maxTotalFileSize
  } = props

  console.log(files)

  let filteredFolders = folders
  let filteredFiles = files

  if (filterInput !== '') {
    filteredFolders = filterItems(folders)
    filteredFiles = filterItems(files)
  }

  const selected = currentSelection.length

  let canSelectMore = true
  if (uppyFiles.length + selected >= maxNumberOfFiles) {
    canSelectMore = false
  }

  if (currentSelection) {
    let totalCurrentSelectionFileSize = 0
    currentSelection.forEach(file => {
      totalCurrentSelectionFileSize += file.size
    })

    if (totalCurrentSelectionFileSize >= maxTotalFileSize) {
      canSelectMore = false
    }
  }

  return (
    <div class={classNames('uppy-ProviderBrowser', `uppy-ProviderBrowser-viewType--${props.viewType}`)}>
      <div class="uppy-ProviderBrowser-header">
        <div class={classNames('uppy-ProviderBrowser-headerBar', !props.showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple')}>
          {props.showBreadcrumbs && Breadcrumbs({
            getFolder: props.getFolder,
            directories: props.directories,
            breadcrumbsIcon: props.pluginIcon && props.pluginIcon(),
            title: props.title
          })}
          <span class="uppy-ProviderBrowser-user">{props.username}</span>
          <button type="button" onclick={props.logout} class="uppy-u-reset uppy-ProviderBrowser-userLogout">
            {props.i18n('logOut')}
          </button>
        </div>
      </div>
      {props.showFilter && <Filter {...props} />}
      <ItemList
        columns={[{
          name: 'Name',
          key: 'title'
        }]}
        folders={filteredFolders}
        files={filteredFiles}
        activeRow={props.isActiveRow}
        sortByTitle={props.sortByTitle}
        sortByDate={props.sortByDate}
        isChecked={props.isChecked}
        handleFolderClick={props.getNextFolder}
        toggleCheckbox={props.toggleCheckbox}
        handleScroll={props.handleScroll}
        title={props.title}
        showTitles={props.showTitles}
        i18n={props.i18n}
        viewType={props.viewType}
        passesRestrictions={props.passesRestrictions}
        maxNumberOfFiles={props.maxNumberOfFiles}
        canSelectMore={canSelectMore}
      />
      {selected > 0 && <FooterActions selected={selected} {...props} />}
    </div>
  )
}

module.exports = Browser
