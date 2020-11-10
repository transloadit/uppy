const classNames = require('classnames')
const Filter = require('./Filter')
const ItemList = require('./ItemList')
const FooterActions = require('./FooterActions')
const prettierBytes = require('@transloadit/prettier-bytes')
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
    maxTotalFileSize,
    i18n
  } = props

  let filteredFolders = folders
  let filteredFiles = files

  if (filterInput !== '') {
    filteredFolders = filterItems(folders)
    filteredFiles = filterItems(files)
  }

  const selected = currentSelection.length
  let restrictionReason = ''
  let canSelectMore = true

  if (maxNumberOfFiles && (uppyFiles.length + selected >= maxNumberOfFiles)) {
    canSelectMore = false
    restrictionReason = i18n('youCanOnlyUploadX', { smart_count: maxNumberOfFiles })
  }

  let currentSelectionFileSizes = 0
  let uppyFileSizes = 0
  if (currentSelection) {
    currentSelection.forEach(file => {
      currentSelectionFileSizes += file.size
    })

    uppyFiles.forEach(file => {
      uppyFileSizes += file.size
    })
  }

  if (maxTotalFileSize && (uppyFileSizes + currentSelectionFileSizes >= maxTotalFileSize)) {
    canSelectMore = false
    restrictionReason = restrictionReason = i18n('exceedsSize2', {
      backwardsCompat: i18n('exceedsSize'),
      size: prettierBytes(maxTotalFileSize)
    })
  }

  return (
    <div class={classNames('uppy-ProviderBrowser', `uppy-ProviderBrowser-viewType--${props.viewType}`)}>
      <div class="uppy-ProviderBrowser-header">
        <div class={classNames('uppy-ProviderBrowser-headerBar', !props.showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple')}>
          {props.headerComponent}
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
        validateRestrictions={props.validateRestrictions}
        restrictionReason={restrictionReason}
        maxNumberOfFiles={props.maxNumberOfFiles}
        maxTotalFileSize={props.maxTotalFileSize}
        canSelectMore={canSelectMore}
      />
      {selected > 0 && <FooterActions selected={selected} {...props} />}
    </div>
  )
}

module.exports = Browser
