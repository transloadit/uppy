const classNames = require('classnames')
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
    filterInput
  } = props

  let filteredFolders = folders
  let filteredFiles = files

  if (filterInput !== '') {
    filteredFolders = filterItems(folders)
    filteredFiles = filterItems(files)
  }

  const selected = currentSelection.length

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
        uppyFiles={uppyFiles}
        currentSelection={currentSelection}
      />
      {selected > 0 && <FooterActions selected={selected} {...props} />}
    </div>
  )
}

module.exports = Browser
