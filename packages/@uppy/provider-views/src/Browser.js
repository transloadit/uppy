const classNames = require('classnames')
const Filter = require('./Filter')
const ItemList = require('./ItemList')
const FooterActions = require('./FooterActions')
const { h } = require('preact')

const Browser = (props) => {
  let filteredFolders = props.folders
  let filteredFiles = props.files

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders)
    filteredFiles = props.filterItems(props.files)
  }

  const selected = props.currentSelection.length

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
      />
      {selected > 0 && <FooterActions selected={selected} {...props} />}
    </div>
  )
}

module.exports = Browser
